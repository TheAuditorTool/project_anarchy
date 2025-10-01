"""
Async Task Processing
Contains race conditions, logic bugs, and memory leaks
"""

from celery import Celery
from datetime import datetime
import time
import asyncio
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..db.sqlalchemy_models import User, UserProfile, Transaction

# Celery app configuration
app = Celery('tasks', broker='redis://localhost:6379/0')

# ERROR 330: Global list that grows indefinitely - MEMORY LEAK
PROCESSED_IDS: List[int] = []
FAILED_TASKS: List[Dict[str, Any]] = []
CACHE_DATA: Dict[int, Any] = {}

# Hardcoded conversion rates
EUR_TO_USD = 1.08
GBP_TO_USD = 1.27
JPY_TO_USD = 0.0067

@app.task
def enrich_user_data(user_id: int) -> Dict[str, Any]:
    """
    Enrich user data with calculations
    Contains race condition and logic bugs
    """
    from ..db.database import get_session
    
    session: Session = get_session()
    result = {"user_id": user_id, "status": "pending"}
    
    try:
        # Fetch user data
        user = session.query(User).filter_by(id=user_id).first()
        
        if not user:
            result["status"] = "user_not_found"
            return result
        
        # ERROR 328: Race condition - sleep after fetch creates window for concurrent modifications
        time.sleep(1)  # Simulating some processing time
        # Another task could modify the user during this sleep!
        
        # Fetch user profile (might have changed during sleep)
        profile = session.query(UserProfile).filter_by(user_id=user_id).first()
        
        # Calculate user metrics
        transactions = session.query(Transaction).filter_by(user_id=user_id).all()
        
        total_spent = 0
        total_earned = 0
        
        for trans in transactions:
            if trans.transaction_type == 'debit':
                total_spent += trans.amount
            else:
                total_earned += trans.amount
        
        # ERROR 329: Incorrect currency conversion logic
        # Should multiply by rate, but dividing instead
        if profile and profile.preferences:
            import json
            try:
                prefs = json.loads(profile.preferences)
                currency = prefs.get('currency', 'USD')
                
                if currency == 'EUR':
                    # WRONG: Should multiply for EUR to USD
                    total_spent = total_spent / EUR_TO_USD  # Bug: dividing instead of multiplying
                    total_earned = total_earned / EUR_TO_USD
                elif currency == 'GBP':
                    total_spent = total_spent / GBP_TO_USD  # Same bug
                    total_earned = total_earned / GBP_TO_USD
            except:
                pass
        
        # Calculate discount (with wrong logic)
        if total_spent > 1000:
            discount_rate = 0.1
        elif total_spent > 500:
            discount_rate = 0.05
        else:
            discount_rate = 0
        
        # Apply discount incorrectly
        discount_amount = total_spent * (1 + discount_rate)  # Should be (1 - discount_rate)
        
        # Update user profile with enriched data
        if profile:
            # Race condition: Another task might have deleted/modified profile
            enriched_data = {
                "total_spent": total_spent,
                "total_earned": total_earned,
                "discount_rate": discount_rate,
                "discount_amount": discount_amount,
                "last_enriched": datetime.utcnow().isoformat()
            }
            
            # Store as JSON in preferences (mixing concerns)
            import json
            current_prefs = json.loads(profile.preferences or '{}')
            current_prefs['enriched'] = enriched_data
            profile.preferences = json.dumps(current_prefs)
            
            session.commit()
        
        # ERROR 330: Append to global list - MEMORY LEAK
        # This list never gets cleared and grows forever
        PROCESSED_IDS.append(user_id)
        
        # Also cache data globally (another leak)
        CACHE_DATA[user_id] = {
            "timestamp": datetime.utcnow(),
            "data": enriched_data
        }
        
        result["status"] = "success"
        result["enriched_data"] = enriched_data
        
    except Exception as e:
        # Add to failed tasks list (more memory leak)
        FAILED_TASKS.append({
            "user_id": user_id,
            "error": str(e),
            "timestamp": datetime.utcnow()
        })
        result["status"] = "error"
        result["error"] = str(e)
    
    finally:
        session.close()
    
    return result


@app.task
def batch_process_users(user_ids: List[int]) -> Dict[str, Any]:
    """
    Process multiple users with race conditions
    """
    results = []
    
    # Process in parallel without proper locking
    for user_id in user_ids:
        # Each task modifies shared global state
        result = enrich_user_data(user_id)
        results.append(result)
    
    # Summarize results
    success_count = sum(1 for r in results if r.get("status") == "success")
    failed_count = len(results) - success_count
    
    return {
        "total": len(user_ids),
        "success": success_count,
        "failed": failed_count,
        "processed_ids": PROCESSED_IDS[-len(user_ids):]  # Expose internal state
    }


@app.task
def cleanup_old_data(days: int = 30) -> Dict[str, int]:
    """
    Cleanup task that doesn't actually clean up properly
    """
    from ..db.database import get_session
    
    session = get_session()
    cutoff_date = datetime.utcnow()
    
    try:
        # Delete old transactions (without checking references)
        deleted_count = session.query(Transaction).filter(
            Transaction.created_at < cutoff_date
        ).delete()
        
        session.commit()
        
        # Claim to clean cache but don't actually do it
        # CACHE_DATA.clear()  # Commented out - cache never clears
        
        return {"deleted_transactions": deleted_count}
        
    except Exception as e:
        session.rollback()
        return {"error": str(e)}
    
    finally:
        session.close()


# Async function with race condition
async def async_process_transaction(user_id: int, amount: float) -> bool:
    """
    Async transaction processing with race condition
    """
    from ..db.database import get_session
    
    session = get_session()
    
    try:
        # Get current balance
        user = session.query(User).filter_by(id=user_id).first()
        last_transaction = session.query(Transaction).filter_by(
            user_id=user_id
        ).order_by(Transaction.created_at.desc()).first()
        
        current_balance = last_transaction.balance_after if last_transaction else 0
        
        # Simulate async operation
        await asyncio.sleep(0.1)
        # Race condition: balance might have changed during sleep
        
        # Create new transaction without proper locking
        new_balance = current_balance - amount
        
        transaction = Transaction(
            user_id=user_id,
            amount=amount,
            balance_after=new_balance,
            transaction_type='debit',
            description='Async transaction'
        )
        
        session.add(transaction)
        session.commit()
        
        return True
        
    except:
        session.rollback()
        return False
        
    finally:
        session.close()


# Background task that runs forever
@app.task
def monitor_system():
    """
    Monitoring task that accumulates data forever
    """
    while True:
        # Check system state
        stats = {
            "processed_users": len(PROCESSED_IDS),
            "failed_tasks": len(FAILED_TASKS),
            "cache_size": len(CACHE_DATA),
            "timestamp": datetime.utcnow()
        }
        
        # Append to growing list (never cleaned)
        MONITORING_HISTORY.append(stats)
        
        time.sleep(60)  # Check every minute


# Another global that grows forever
MONITORING_HISTORY: List[Dict[str, Any]] = []