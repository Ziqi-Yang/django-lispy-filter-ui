// types.ts
export type Operator = 'and' | 'or' | 'not' | 'xor';
export type ComparisonOperator = 'equals' | 'contains' | 'greater_than' | 'less_than';

export interface BaseNode {
  id: string;
  not: boolean;
}

export interface Condition extends BaseNode {
  type: 'condition';
  field: string;
  operator: ComparisonOperator;
  value: string;
}

export interface Group extends BaseNode {
  type: 'group';
  operator: Operator;
  children: (Condition | Group)[];
}

export interface Field {
  name: string;
  label: string;
  operators: ComparisonOperator[];
}

export interface FilterEditorOptions {
  container: HTMLElement | string;
  onChange?: (filter: Group) => void;
  onError?: (error: Error) => void;
  fields: Field[];
  initialValue?: Group;
}
