/**
 * TypeScript Violations Test File
 * Phase 10: Contains 7 intentional TypeScript violations for TheAuditor validation
 * Errors 203-209
 */

// ERROR 203: Explicitly using 'any' type
let userData: any = { name: "John", age: 30 };
userData = "This can be anything now";
userData = 123;

// ERROR 204: Function with implicit 'any' parameter
function processItem(item) {  // 'item' implicitly has 'any' type
    return item.value * 2;
}

// ERROR 205: Function with no explicit return type
function calculateSum(a: number, b: number) {  // Missing return type annotation
    return a + b;
}

// ERROR 206: Non-null assertion on potentially null value
function riskyAccess(data: { value?: number } | null) {
    // Using ! operator when data could be null or value could be undefined
    const result = data!.value!;
    return result * 2;
}

// ERROR 207: Type assertion on incompatible type
const numberValue = 42;
const stringValue = numberValue as unknown as string;  // Forcing number to string

// ERROR 208: @ts-ignore suppressing a clear type error
// @ts-ignore
const impossibleAssignment: string = 123;  // Assigning number to string

// ERROR 209: Interface and type for similar shapes (inconsistency)
interface UserInterface {
    id: number;
    name: string;
    email: string;
}

type UserType = {
    id: number;
    name: string;
    email: string;
};

// Both define the same shape but using different constructs

class TypeScriptViolator {
    private data: any;  // Using any in class property
    
    constructor() {
        this.data = {};
    }
    
    // Method demonstrating multiple violations
    public processData(input) {  // Implicit any parameter
        const processed = processItem(input);
        const sum = calculateSum(10, 20);
        const risky = riskyAccess({ value: 42 });
        
        // More any usage
        let flexible: any = "start";
        flexible = 100;
        flexible = { key: "value" };
        
        return {
            processed,
            sum,
            risky,
            flexible,
            userData,
            stringValue
        };
    }
    
    // Method with missing return type
    public getData() {
        return this.data;
    }
}

export {
    TypeScriptViolator,
    UserInterface,
    UserType,
    processItem,
    calculateSum,
    riskyAccess
};