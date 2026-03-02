'use server';

export async function runUserCode(code: string, helpers: any): Promise<any> {
    console.log("runUserCode triggered code : ", code);
    
    try {
        const safeHelpers = {
            // Basic math helpers
            multiply: (a: number, b: number) => a * b,
            add: (a: number, b: number) => a + b,
            subtract: (a: number, b: number) => a - b,
            divide: (a: number, b: number) => b !== 0 ? a / b : 0,
            
            // Array/data manipulation helpers
            sum: (arr: number[]) => arr.reduce((a, b) => a + b, 0),
            average: (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,
            max: (arr: number[]) => Math.max(...arr),
            min: (arr: number[]) => Math.min(...arr),
            sortBy: (arr: any[], key: string, desc = false) => {
                return [...arr].sort((a, b) => {
                    const aVal = a[key];
                    const bVal = b[key];
                    if (desc) return bVal - aVal;
                    return aVal - bVal;
                });
            },
            
            // Group by helper for data analysis
            groupBy: (arr: any[], key: string) => {
                return arr.reduce((groups, item) => {
                    const groupKey = item[key];
                    if (!groups[groupKey]) groups[groupKey] = [];
                    groups[groupKey].push(item);
                    return groups;
                }, {});
            },
            
            // Date helpers
            formatDate: (date: string | Date) => new Date(date).toLocaleDateString(),
            daysBetween: (date1: string | Date, date2: string | Date) => {
                const d1 = new Date(date1);
                const d2 = new Date(date2);
                return Math.abs((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
            },
            
            // Include any custom helpers passed in
            ...helpers,
            
            // Safe built-ins
            Math: Math,
            Date: Date,
            JSON: JSON,
            console: {
                log: (...args: any[]) => console.log('[SANDBOX]', ...args),
                error: (...args: any[]) => console.error('[SANDBOX]', ...args),
            },
        };

        // Wrap code in async function with error handling
        const asyncFunction = new Function(
            'helpers', 
            `
            return (async () => {
                try {
                    // Destructure all available helpers
                    const { 
                        multiply, add, subtract, divide, sum, average, max, min, sortBy, groupBy,
                        formatDate, daysBetween, Math, Date, JSON, console, fetch,
                        ...otherHelpers
                    } = helpers;
                    
                    // Execute user code
                    ${code}
                } catch (error) {
                    throw new Error(\`Code execution failed: \${error.message}\`);
                }
            })();
            `
        );

        // Execute with timeout
        const executionPromise = asyncFunction(safeHelpers);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Execution timeout (5 seconds)')), 50000)
        );

        const result = await Promise.race([executionPromise, timeoutPromise]);
        
        return { success: true, result };
    } catch (err: any) {
        console.error('Sandbox execution error:', err);
        return { 
            success: false, 
            error: err.message,
            stack: err.stack 
        };
    }
}