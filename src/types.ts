type StringAndOthers<T extends unknown[]> = [string, ...T];

export interface SchemaField {
  verbose_name: string;
  class: string;
  choices: null | Record<string, string>;
}

export interface SchemaModel {
  __rel: string[];
  [key: string]: SchemaField | string[];
}

export interface SchemaModels {
  [key: string]: SchemaModel;
}

export interface SchemaLookups {
  [key: string]: string[];
}

export interface Schema {
  models: SchemaModels;
  lookups: SchemaLookups;
}


export type LispyFunction = StringAndOthers<unknown[]>;
export type LispyConditionExpr = readonly ['=', string, string | number | boolean | LispyFunction];

type LispyNotExpr = ['not', LispyExpression];
type LispyAndOrExpr = ['and' | 'or', ...LispyExpression[]];

export type LispyExpression = 
  | LispyNotExpr 
  | LispyAndOrExpr
  | LispyConditionExpr;

export type LispyOperator = 'not' | 'and' | 'or';


export interface FilterEditorOptions {
  container: HTMLElement | string;
  schema: any;
  initialExpression?: LispyExpression;
}



//
//                           AI-written type-check functions
//
export function isLispyOperator(value: unknown): value is LispyOperator {
  return typeof value === 'string' && ['not', 'xor', 'and', 'or'].includes(value);
}

export function isLispyConditionExpr(expr: unknown): expr is LispyConditionExpr {
  if (!Array.isArray(expr)) {
    return false;
  }

  if (expr.length !== 3) {
    return false;
  }

  if (expr[0] !== '=') {
    return false;
  }

  if (typeof expr[1] !== 'string') {
    return false;
  }

  const thirdElement = expr[2];
  const isValidThirdElement = 
        typeof thirdElement === 'string' ||
          typeof thirdElement === 'number' ||
          typeof thirdElement === 'boolean' ||
          Array.isArray(thirdElement);

  return isValidThirdElement;
}

export function isLispyNotExpr(expr: unknown): expr is LispyNotExpr {
  return Array.isArray(expr) &&
    expr.length === 2 &&
    expr[0] === 'not' &&
    isLispyExpression(expr[1]);
}


export function isLispyAndOrExpr(expr: unknown): expr is LispyAndOrExpr {
  if (!Array.isArray(expr) || expr.length < 2) {
    return false;
  }

  const [operator, ...operands] = expr;
  return (operator === 'and' || operator === 'or') &&
    operands.every(operand => isLispyExpression(operand));
}

export function isLispyExpression(expr: unknown): expr is LispyExpression {
  return isLispyNotExpr(expr) ||
    isLispyAndOrExpr(expr) ||
    isLispyConditionExpr(expr);
}
