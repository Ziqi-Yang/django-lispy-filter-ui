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
type LispyXorExpr = ['xor', LispyExpression, LispyExpression];
type LispyAndOrExpr = ['and' | 'or', ...LispyExpression[]];

export type LispyExpression = 
  | LispyNotExpr 
  | LispyXorExpr 
  | LispyAndOrExpr
  | LispyConditionExpr;

export type LispyOperator = 'not' | 'xor' | 'and' | 'or';

export interface FilterEditorOptions {
  container: HTMLElement | string;
  schema: any;
  initialExpression?: LispyExpression;
}
