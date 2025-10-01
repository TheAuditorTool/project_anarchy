"""
API Endpoint with IDOR (Insecure Direct Object Reference) Vulnerability
Allows users to access other users' data by manipulating IDs
"""

from flask import Flask, request, jsonify
import sqlite3
import json

app = Flask(__name__)

# Database helper
def get_db():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

# ERROR 362: IDOR Vulnerability - No authorization check for resource access
@app.route('/api/users/<int:user_id>/profile', methods=['GET'])
def get_user_profile(user_id):
    """
    VULNERABLE: Any authenticated user can access any other user's profile
    by simply changing the user_id in the URL
    
    Example:
    - User A (id=1) logs in and gets a valid session
    - User A changes URL from /api/users/1/profile to /api/users/2/profile
    - User A now sees User B's private profile data!
    """
    
    # Get the auth token (but don't verify ownership!)
    auth_token = request.headers.get('Authorization')
    
    if not auth_token:
        return jsonify({'error': 'No authorization token'}), 401
    
    # Verify token is valid (but not checking if token owner matches user_id!)
    # Just checking if ANY valid token exists
    if not verify_token(auth_token):
        return jsonify({'error': 'Invalid token'}), 401
    
    # VULNERABILITY: No check if the authenticated user owns this profile!
    # Should verify: token_user_id == user_id
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Directly using user_id from URL without authorization
    cursor.execute("""
        SELECT id, email, full_name, phone, address, 
               ssn, credit_card_last4, bank_account,
               salary, medical_records, private_notes
        FROM users 
        WHERE id = ?
    """, (user_id,))
    
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Returning sensitive data without checking permissions!
    return jsonify({
        'id': user['id'],
        'email': user['email'],
        'full_name': user['full_name'],
        'phone': user['phone'],
        'address': user['address'],
        'ssn': user['ssn'],  # Sensitive!
        'credit_card_last4': user['credit_card_last4'],
        'bank_account': user['bank_account'],  # Sensitive!
        'salary': user['salary'],  # Sensitive!
        'medical_records': json.loads(user['medical_records'] or '{}'),  # HIPAA violation!
        'private_notes': user['private_notes']
    })

# More IDOR vulnerabilities in other endpoints
@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """Another IDOR: Access any order by ID"""
    auth_token = request.headers.get('Authorization')
    
    if not auth_token or not verify_token(auth_token):
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Not checking if user owns this order!
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
    order = cursor.fetchone()
    conn.close()
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    return jsonify(dict(order))

@app.route('/api/documents/<int:doc_id>/download', methods=['GET'])
def download_document(doc_id):
    """IDOR in document access"""
    auth_token = request.headers.get('Authorization')
    
    if not auth_token or not verify_token(auth_token):
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Not checking document ownership!
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    doc = cursor.fetchone()
    conn.close()
    
    if not doc:
        return jsonify({'error': 'Document not found'}), 404
    
    # Returning private documents without permission check
    return jsonify({
        'filename': doc['filename'],
        'content': doc['content'],  # Could be confidential!
        'owner_id': doc['owner_id']
    })

@app.route('/api/accounts/<int:account_id>/transactions', methods=['GET'])
def get_transactions(account_id):
    """IDOR in financial data"""
    auth_token = request.headers.get('Authorization')
    
    if not auth_token or not verify_token(auth_token):
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Not verifying account ownership!
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM transactions 
        WHERE account_id = ? 
        ORDER BY created_at DESC
    """, (account_id,))
    
    transactions = cursor.fetchall()
    conn.close()
    
    # Exposing all financial transactions!
    return jsonify([dict(t) for t in transactions])

def verify_token(token):
    """Dummy token verification - just checks format"""
    # This only verifies token format, not ownership!
    return token and len(token) > 10

# The fix would be:
def secure_get_user_profile(user_id):
    """SECURE VERSION - How it should be done"""
    auth_token = request.headers.get('Authorization')
    
    if not auth_token:
        return jsonify({'error': 'No authorization token'}), 401
    
    # Get the user ID from the token
    token_user_id = get_user_id_from_token(auth_token)
    
    if not token_user_id:
        return jsonify({'error': 'Invalid token'}), 401
    
    # CRITICAL CHECK: Verify the user owns this resource
    if token_user_id != user_id:
        # User is trying to access another user's data!
        return jsonify({'error': 'Forbidden'}), 403
    
    # Now safe to return the user's own data
    # ... rest of the implementation


if __name__ == '__main__':
    app.run(debug=True)  # Debug mode in production!