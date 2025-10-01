/**
 * UserWidget Component with Frontend-Specific 'any' Type Violations
 * Demonstrates React/TypeScript anti-patterns common in frontend code
 */

import React, { useState, useEffect, useCallback } from 'react';

/**
 * ERROR 372: Component accepts untyped props
 * This is one of the most common TypeScript violations in React
 * Makes it impossible to know what props are required or their types
 */
const UserWidget = (props: any) => {
    // ERROR 373: State initialized without proper type, defaulting to 'any'
    // This means userData can be literally anything, breaking type safety
    const [userData, setUserData] = useState<any>(null);
    
    // Additional state with 'any' type
    const [loading, setLoading] = useState<any>(false);
    const [filters, setFilters] = useState<any>({});
    
    // ERROR 374: Callback function with 'any' parameter
    // Error handling loses all type information
    const handleError = (error: any) => {
        console.error("Failed to fetch user:", error);
        // Accessing properties that might not exist
        const errorMessage = error?.response?.data?.message || error.message || 'Unknown error';
        props.onError?.(errorMessage);
    };
    
    // Event handler with untyped event
    const handleClick = (event: any) => {
        event.preventDefault();
        // No type checking on event properties
        const target = event.target;
        const value = target.value || target.innerText;
        props.onClick?.(value);
    };
    
    // Function that processes data with no type information
    const processUserData = useCallback((data: any): any => {
        // Complex data manipulation with no type safety
        return {
            ...data,
            fullName: `${data?.firstName || ''} ${data?.lastName || ''}`.trim(),
            age: data?.birthDate ? calculateAge(data.birthDate) : null,
            permissions: data?.role?.permissions || [],
            isActive: data?.status === 'active'
        };
    }, []);
    
    useEffect(() => {
        // ERROR 375: Chain of untyped function calls
        // No way to verify if these methods exist or what they return
        props.fetchUser(props.userId)
            .then((response: any) => {
                // Processing response with no type information
                const processed = processUserData(response.data || response);
                setUserData(processed);
            })
            .catch(handleError);
    }, [props.userId, props.fetchUser, processUserData]);
    
    // Additional effect with 'any' dependencies
    useEffect(() => {
        // Subscription pattern with untyped callbacks
        const unsubscribe = props.eventBus?.subscribe('user-update', (data: any) => {
            setUserData((prev: any) => ({ ...prev, ...data }));
        });
        
        return () => {
            // Cleanup might fail if unsubscribe doesn't exist
            unsubscribe?.();
        };
    }, [props.eventBus]);
    
    // Function to calculate age (with potential type issues)
    const calculateAge = (birthDate: any): number => {
        // birthDate could be string, Date, number, or anything else
        const birth = new Date(birthDate);
        const diff = Date.now() - birth.getTime();
        return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    };
    
    // Render method accessing deeply nested properties with no safety
    if (loading) {
        return <div>Loading...</div>;
    }
    
    if (!userData) {
        return <div>No user data available</div>;
    }
    
    // ERROR (additional): Accessing nested properties that might not exist
    // The component relies on the 'any' type to access nested properties
    return (
        <div className={props.className} onClick={handleClick}>
            <h3>{userData.profile?.name || userData.fullName}</h3>
            <p>Email: {userData.contact?.email || userData.email}</p>
            <p>Role: {userData.role?.name || 'No role'}</p>
            <p>Department: {userData.department?.title}</p>
            <div>
                Permissions:
                {userData.permissions?.map((perm: any, index: any) => (
                    <span key={index}>{perm.name || perm}</span>
                ))}
            </div>
            {/* Conditional rendering based on untyped props */}
            {props.showActions && (
                <div>
                    <button onClick={() => props.onEdit?.(userData)}>Edit</button>
                    <button onClick={() => props.onDelete?.(userData.id)}>Delete</button>
                </div>
            )}
        </div>
    );
};

/**
 * Higher-order component with 'any' violations
 */
export const withUserData = (Component: any) => {
    return (props: any) => {
        const [user, setUser] = useState<any>(null);
        
        // HOC logic with no type safety
        useEffect(() => {
            fetchUserData(props.userId).then(setUser);
        }, [props.userId]);
        
        return <Component {...props} user={user} />;
    };
};

/**
 * Custom hook with 'any' violations
 */
export const useUserData = (userId: any): any => {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<any>(null);
    
    useEffect(() => {
        // Async operation with no type checking
        fetchUserData(userId)
            .then(setData)
            .catch(setError);
    }, [userId]);
    
    return { data, error };
};

/**
 * Mock fetch function
 */
async function fetchUserData(userId: any): Promise<any> {
    // Simulated API call
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: userId,
                name: 'John Doe',
                email: 'john@example.com'
            });
        }, 1000);
    });
}

export default UserWidget;