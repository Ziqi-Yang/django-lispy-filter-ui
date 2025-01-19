import type {
  FilterEditorOptions,
  LispyExpression,
  LispyConditionExpr,
  LispyOperator,
  Schema
} from './types';

import { trans } from './trans';

// simple function for type check
function isLispyExpression(expr: any): expr is LispyExpression {
  return Array.isArray(expr) && typeof expr[0] === 'string';
}


export class FilterEditor {
  private container: HTMLElement;
  private expression: LispyExpression;
  private schema: Schema;

  constructor(options: FilterEditorOptions) {
    const container = typeof options.container === 'string' 
      ? document.querySelector(options.container)! 
      : options.container;
    
    if (!container)
      throw Error(`Cannot find element ${options.container}`)
    this.container = container as HTMLElement;
        
    this.expression = options.initialExpression || ['and'];
    this.schema = options.schema
    this.init();
  }

  private init(): void {
    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.innerHTML = `
    <div class="dlf-root-container">
      ${this.renderExpression(this.expression)}
    </div>
    `;
  }

  private renderExpression(expr: LispyExpression): string {
    let isNegated = false;
    let [operator, ...subExpressions] = expr;

    // Handle negation
    if (operator === 'not') {
      if (subExpressions.length !== 1) {
        throw new Error('NOT expression must have exactly one subexpression');
      }
        
      isNegated = true;
      const nestedExpr = subExpressions[0];
      [operator, ...subExpressions] = nestedExpr;
    }

    if (operator == "=") {
      // TODO handle this situation
      throw Error(`Wrong expression: ${expr}`)
    }

    const children = subExpressions.map(expr => {
      if (!isLispyExpression(expr)) {
        throw new Error('Invalid expression');
      }
      
      return expr[0] == "="
        ? this.renderCondition(expr as LispyConditionExpr)
        : this.renderExpression(expr as LispyExpression)
    }).join('');
    
    return `
    <div class="dlf-group dlf-expanded">
      <div class="dlf-group-prefix">
        ${isNegated ? this.renderOperator('not') : ""}
        ${this.renderOperator(operator)}
        <div class="dlf-group-collapse">
          <span class="dlf-parenthesis">(</span>
          <span class="dlf-ellipsis">...</span>
          <span class="dlf-parenthesis">)</span>
        </div>          
      </div>
        
      <div class="dlf-indent">
        ${children}
        <div>
          <div class="tooltip" data-tip="${trans('add-new-condition')}" >
            <button class="btn btn-xs btn-circle" data-action="add-group">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
                class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div class="dlf-parenthesis">)</div>
    </div>
    `;
  }

  private renderOperator(operator: LispyOperator) {
    let tip = trans(["operator-tip", operator]);
    return `
    <span class="dlf-operator dlf-${operator}-operator tooltip" data-tip="${tip}">
      ${trans(["operator", operator])}
    </span>
    `;
  }

  private renderCondition(condition: LispyConditionExpr): string {
    const [field, ...lookups] = condition[1].split("__");
    const value = condition[2];
    
    
    return `
    <div class="dlf-condition group">
      <span>${field} ${lookups} ${value}</span>
      
      <div class="invisible group-hover:visible gap-2">
        <div class="tooltip" data-tip="${trans('delete-condition')}">
          <button class="btn btn-xs btn-circle" data-action="delete">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              stroke-width="2.5" stroke="currentColor"
              class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    `;
  }

  private attachEventListeners(): void {
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');

      console.log(target, button);
      
      if (target.closest('.dlf-group-collapse')) {
        const group = target.closest('.dlf-group');
        if (group) {
          group.classList.toggle('dlf-expanded');
        }
        return;
      }

      // if (!button) return;

      // const action = button.dataset.action;
      
      // if (action === 'add-group') {
      //   const group = button.closest('.dlf-group');
      //   if (group) {
      //     this.addGroup(group);
      //   }
      //   return;
      // }

      // const condition = button.closest('.dlf-condition');
      // if (!condition) return;
      
      // if (action === 'delete') {
      //   this.deleteCondition(condition);
      // } else if (action === 'add') {
      //   this.addCondition(condition);
      // }
    });
  }
}
