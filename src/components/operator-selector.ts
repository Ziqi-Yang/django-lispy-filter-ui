interface OperatorOption {
    value: string;
    display: string;
}


export class OperatorSelect {
    private element: HTMLElement;
    private isEditing: boolean = false;
    private selectElement: HTMLDivElement | null = null;

    private options: OperatorOption[] = [
        { value: 'not', display: 'Not'},
        { value: 'and', display: 'And'},
        { value: 'or', display: 'Or'},
        { value: 'xor', display: 'Xor'},
    ];

    constructor(element: HTMLElement) {
      this.element = element;
      this.toggleEdit()
    }

    private createSelect(): HTMLDivElement {
        const select = document.createElement('div');
        select.className = 'dlf:absolute dlf:bg-white dlf:border dlf:border-gray-300 dlf:rounded dlf:shadow-lg dlf:z-50';
        
        this.options.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = `dlf-operator dlf-${option.value}-operator dlf:cursor-pointer dlf:p-2 dlf:hover:bg-gray-100`;
            optionElement.textContent = option.display;
            optionElement.setAttribute('data-value', option.value);
            
            optionElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectOption(option);
            });
            
            select.appendChild(optionElement);
        });

        // Position the select below the element
        const rect = this.element.getBoundingClientRect();
        select.style.top = `${rect.bottom}px`;
        select.style.left = `${rect.left}px`;
        
        return select;
    }

    private toggleEdit(): void {
        if (!this.isEditing) {
            this.isEditing = true;
            this.selectElement = this.createSelect();
            document.body.appendChild(this.selectElement);

            // Close select when clicking outside
            const closeHandler = (e: MouseEvent) => {
                if (this.selectElement && !this.selectElement.contains(e.target as Node)) {
                    this.closeSelect();
                    document.removeEventListener('click', closeHandler);
                }
            };
            
            setTimeout(() => {
                document.addEventListener('click', closeHandler);
            }, 0);
        }
    }

    private closeSelect(): void {
        if (this.selectElement) {
            this.selectElement.remove();
            this.selectElement = null;
        }
        this.isEditing = false;
    }

    private selectOption(option: OperatorOption): void {
        this.element.textContent = option.display;
        this.element.className = `dlf-operator dlf-${option.value}-operator dlf:tooltip`;
        this.element.setAttribute('data-value', option.value);
        this.element.setAttribute('data-tip', option.display);
        this.closeSelect();
    }
}
