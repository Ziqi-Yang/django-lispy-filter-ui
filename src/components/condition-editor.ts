import type { ComparisonOperator, Condition, Field } from "@/types";

// components/condition-editor.ts
export class ConditionEditor {
    private element: HTMLElement;
    private condition: Condition;
    private fields: Field[];

    constructor(condition: Condition, fields: Field[], onChange: () => void) {
        this.condition = condition;
        this.fields = fields;
        this.element = document.createElement('div');
        this.element.className = 'dlf-condition group';
        this.render();
    }

    private render(): void {
        this.element.innerHTML = `
            <div class="flex gap-2 items-center">
                <button class="btn btn-xs ${this.condition.not ? 'btn-active' : ''}" data-action="toggle-not">
                    Not
                </button>
                <select class="select select-sm" data-action="field">
                    ${this.fields.map(field => `
                        <option value="${field.name}" ${this.condition.field === field.name ? 'selected' : ''}>
                            ${field.label}
                        </option>
                    `).join('')}
                </select>
                <select class="select select-sm" data-action="operator">
                    ${this.getOperatorsForField().map(op => `
                        <option value="${op}" ${this.condition.operator === op ? 'selected' : ''}>
                            ${op}
                        </option>
                    `).join('')}
                </select>
                <input 
                    type="text" 
                    class="input input-sm" 
                    value="${this.condition.value}"
                    data-action="value"
                >
                <button class="btn btn-xs btn-error" data-action="delete">
                    <svg class="size-4" ...>...</svg>
                </button>
            </div>
        `;
    }

    private getOperatorsForField(): ComparisonOperator[] {
        const field = this.fields.find(f => f.name === this.condition.field);
        return field?.operators || [];
    }
}

