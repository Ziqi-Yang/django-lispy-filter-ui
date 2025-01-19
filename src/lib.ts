import type {
  FilterEditorOptions,
  LispyExpression,
  LispyConditionExpr,
  LispyOperator,
  Schema
} from './types';

import { isLispyConditionExpr, isLispyExpression } from './types';

import { trans } from './trans';

import { OperatorSelect } from './components/operator-selector';


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

    console.log(this.toJson());
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
      const conditionExpr = [operator, ...subExpressions];
      if (!isLispyConditionExpr(conditionExpr)) {
        throw Error(`${conditionExpr} is a valid LispyConditionExpr!`);
      }
      
      return this.renderCondition(conditionExpr, true);
    }

    const children = subExpressions.map(expr => {
      if (!isLispyExpression(expr)) {
        throw new Error(`${expr} is not a valid LispyExpression`);
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
            <button class="btn btn-xs btn-circle" data-action="add-condition">
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

  private renderCondition(
    condition: LispyConditionExpr,
    isNegated: boolean = false
  ): string {
    const [field, ...lookups] = condition[1].split("__");
    const value = condition[2];
    
    
    return `
    <div class="dlf-condition group">
      ${isNegated ? this.renderOperator('not') : ""}
      <span>${field} ${lookups} ${value}</span>
      
      <div class="invisible group-hover:visible gap-2">
        <div class="tooltip" data-tip="${trans('delete-condition')}">
          <button class="btn btn-xs btn-circle" data-action="delete-condition">
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
      
      if (target.closest('.dlf-group-collapse')) {
        const group = target.closest('.dlf-group');
        if (group) {
          group.classList.toggle('dlf-expanded');
        }
        return;
      }

      const button = target.closest('button');
      if (button) {
        const action = button.dataset.action;

        switch (action) {
          case 'add-condition':
            console.log('add');
            break;
          case 'delete-condition':
            console.log('delete');
            break;
        }
        return;
      }

      const operatorElem = target.closest('.dlf-operator');
      if (operatorElem && operatorElem.closest('.dlf-group-prefix')) {
        new OperatorSelect(operatorElem as HTMLElement);
      }
    });
  }

  public toJson(): LispyExpression {
    const rootGroup = this.container.querySelector('.dlf-group');
    if (!rootGroup) {
      return ['and']; // Default empty expression
    }
    return this.parseGroup(rootGroup);
  }

  private parseGroup(groupElement: Element): LispyExpression {
    const operators = Array.from(
      groupElement.querySelectorAll('.dlf-group-prefix .dlf-operator')
    ).map(op => op.classList.toString());

    // Check if this group is negated
    const isNegated = operators.some(cls => cls.includes('dlf-not-operator'));
    
    // Get the main operator (and/or/xor)
    const mainOperator = operators.find(cls => 
      ['dlf-and-operator', 'dlf-or-operator', 'dlf-xor-operator'].some(op => cls.includes(op))
    );
    
    const operator = mainOperator
      ?.match(/dlf-(and|or|xor)-operator/)?.[1] || 'and';

    // Parse all conditions and nested groups
    const indent = groupElement.querySelector('.dlf-indent');
    if (!indent) {
      return [operator];
    }

    const children = Array.from(indent.children)
      .filter(child => 
        child.classList.contains('dlf-condition') || 
        child.classList.contains('dlf-group')
      )
      .map(child => {
        if (child.classList.contains('dlf-condition')) {
          return this.parseCondition(child);
        } else {
          return this.parseGroup(child);
        }
      });

    const expression: LispyExpression = [operator, ...children];
    
    // Wrap in NOT if negated
    return isNegated ? ['not', expression] : expression;
  }

  private parseCondition(conditionElement: Element): LispyExpression {
    const isNegated = conditionElement



    // For demo, just extract the text content
    // In real implementation, you'll want to parse the actual field and value
    const text = conditionElement.textContent?.trim() || '';
    const parts = text.split(' ').filter(Boolean);
    
    // Create a basic condition expression
    // This is a simplified version - you'll need to adjust based on your actual condition format
    const condition: LispyConditionExpr = ['=', parts[0], parts[parts.length - 1]];
    
    return isNegated ? ['not', condition] : condition;
  }
}


