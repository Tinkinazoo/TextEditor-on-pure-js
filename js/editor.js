class TextEditor {
    constructor() {
        this.editor = document.getElementById('editor');
        this.fileInput = document.getElementById('file-input');
        this.findModal = document.getElementById('find-modal');
        this.initializeEventListeners();
        this.setupEditor();
        this.lastSaveType = 'html';
        this.lastOpenedFilename = 'document';
    }

    initializeEventListeners() {
        // Файловые операции
        document.getElementById('new-file').addEventListener('click', () => this.newFile());
        document.getElementById('open-file').addEventListener('click', () => this.openFile());
        document.getElementById('save-file').addEventListener('click', () => this.showSaveDialog());
        document.getElementById('print').addEventListener('click', () => this.printFile());

        // Форматирование текста
        document.getElementById('font-family').addEventListener('change', (e) => this.applyStyle('font-family', e.target.value));
        document.getElementById('font-size').addEventListener('change', (e) => this.applyStyle('font-size', this.getFontSizeValue(e.target.value)));
        
        // Стили текста
        document.getElementById('bold').addEventListener('click', () => this.toggleStyle('font-weight', 'bold', 'normal'));
        document.getElementById('italic').addEventListener('click', () => this.toggleStyle('font-style', 'italic', 'normal'));
        document.getElementById('underline').addEventListener('click', () => this.toggleStyle('text-decoration', 'underline', 'none'));
        document.getElementById('strike').addEventListener('click', () => this.toggleStyle('text-decoration', 'line-through', 'none'));

        // Выравнивание
        document.getElementById('align-left').addEventListener('click', () => this.applyStyle('text-align', 'left'));
        document.getElementById('align-center').addEventListener('click', () => this.applyStyle('text-align', 'center'));
        document.getElementById('align-right').addEventListener('click', () => this.applyStyle('text-align', 'right'));
        document.getElementById('align-justify').addEventListener('click', () => this.applyStyle('text-align', 'justify'));

        // Цвета
        document.getElementById('text-color').addEventListener('change', (e) => this.applyStyle('color', e.target.value));
        document.getElementById('bg-color').addEventListener('change', (e) => this.applyStyle('background-color', e.target.value));

        // Списки
        document.getElementById('insert-ul').addEventListener('click', () => this.formatText('insertUnorderedList'));
        document.getElementById('insert-ol').addEventListener('click', () => this.formatText('insertOrderedList'));

        // Дополнительные функции
        document.getElementById('undo').addEventListener('click', () => this.formatText('undo'));
        document.getElementById('redo').addEventListener('click', () => this.formatText('redo'));
        document.getElementById('find').addEventListener('click', () => this.showFindModal());

        // Модальное окно поиска
        document.querySelector('.close').addEventListener('click', () => this.hideFindModal());
        document.getElementById('find-next').addEventListener('click', () => this.findText());
        document.getElementById('replace').addEventListener('click', () => this.replaceText());
        document.getElementById('replace-all').addEventListener('click', () => this.replaceAllText());

        // Обработка загрузки файла
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Обновление статистики
        this.editor.addEventListener('input', () => this.updateStats());
        this.editor.addEventListener('keyup', () => this.updateStats());
        this.editor.addEventListener('mouseup', () => this.updateCursorPosition());
    }

    setupEditor() {
        this.editor.setAttribute('placeholder', 'Начните печатать здесь...');
        this.updateStats();
    }

    getFontSizeValue(sizeValue) {
        const sizes = {
            '1': '8px',
            '2': '10px',
            '3': '12px',
            '4': '14px',
            '5': '18px',
            '6': '24px',
            '7': '36px'
        };
        return sizes[sizeValue] || '12px';
    }

    applyStyle(property, value) {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand(property, false, value);
        this.editor.focus();
    }

    toggleStyle(property, valueOn, valueOff) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        let hasStyle = false;

        if (property === 'font-weight') {
            hasStyle = document.queryCommandState('bold');
        } else if (property === 'font-style') {
            hasStyle = document.queryCommandState('italic');
        }

        const value = hasStyle ? valueOff : valueOn;
        this.applyStyle(property, value);
    }

    formatText(command, value = null) {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand(command, false, value);
        this.editor.focus();
    }

    newFile() {
        if (confirm('Создать новый файл? Несохраненные данные будут потеряны.')) {
            this.editor.innerHTML = '';
            this.lastOpenedFilename = 'document';
            this.updateStats();
        }
    }

    openFile() {
        this.fileInput.click();
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.editor.innerHTML = e.target.result;
            this.cleanupHTML();
            this.updateStats();
            
            this.lastOpenedFilename = file.name.replace(/\.[^/.]+$/, "");
        };
        reader.readAsText(file);
    }

    showSaveDialog() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h3>Сохранить файл</h3>
                <div class="save-options">
                    <label>
                        <input type="radio" name="saveType" value="html" checked> HTML файл
                    </label>
                    <label>
                        <input type="radio" name="saveType" value="txt"> Текстовый файл
                    </label>
                    <label>
                        <input type="radio" name="saveType" value="pdf"> PDF (печать)
                    </label>
                </div>
                <div class="filename-input">
                    <label>Имя файла:</label>
                    <input type="text" id="filename" value="${this.lastOpenedFilename}" placeholder="Введите имя файла">
                </div>
                <div class="modal-buttons">
                    <button id="confirm-save">Сохранить</button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()">Отмена</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        document.getElementById('confirm-save').addEventListener('click', () => {
            const saveType = document.querySelector('input[name="saveType"]:checked').value;
            const filename = document.getElementById('filename').value || 'document';
            this.lastSaveType = saveType;
            this.lastOpenedFilename = filename;
            
            switch(saveType) {
                case 'html':
                    this.saveAsHTML(filename);
                    break;
                case 'txt':
                    this.saveAsText(filename);
                    break;
                case 'pdf':
                    this.saveAsPDF();
                    break;
            }
            
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    saveAsHTML(filename) {
        this.cleanupHTML();
        const content = this.editor.innerHTML;
        const blob = new Blob([content], { type: 'text/html' });
        this.downloadFile(blob, `${filename}.html`);
    }

    saveAsText(filename) {
        const text = this.editor.innerText || this.editor.textContent;
        const blob = new Blob([text], { type: 'text/plain' });
        this.downloadFile(blob, `${filename}.txt`);
    }

    saveAsPDF() {
        this.printFile();
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    quickSave() {
        const filename = prompt('Введите имя файла:', this.lastOpenedFilename) || this.lastOpenedFilename;
        
        switch(this.lastSaveType) {
            case 'html':
                this.saveAsHTML(filename);
                break;
            case 'txt':
                this.saveAsText(filename);
                break;
            case 'pdf':
                this.saveAsPDF();
                break;
        }
    }

    cleanupHTML() {
        let html = this.editor.innerHTML;
        
        html = html.replace(/<font[^>]*>/gi, '');
        html = html.replace(/<\/font>/gi, '');
        
        html = html.replace(/<(\w+)[^>]*\s(size|face|color)=["'][^"']*["'][^>]*>/gi, '<$1>');
        
        this.editor.innerHTML = html;
    }

    printFile() {
        this.cleanupHTML();
        const printContent = this.editor.innerHTML;
        const originalContent = document.body.innerHTML;
        
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        
        location.reload();
    }

    updateStats() {
        const text = this.editor.innerText || this.editor.textContent;
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        
        document.getElementById('char-count').textContent = `Символов: ${charCount}`;
        document.getElementById('word-count').textContent = `Слов: ${wordCount}`;
    }

    updateCursorPosition() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(this.editor);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            
            const lineBreaks = (preCaretRange.toString().match(/\n/g) || []).length;
            document.getElementById('cursor-position').textContent = `Строка: ${lineBreaks + 1}`;
        }
    }

    showFindModal() {
        this.findModal.style.display = 'block';
        document.getElementById('find-text').focus();
    }

    hideFindModal() {
        this.findModal.style.display = 'none';
    }

    findText() {
        const findText = document.getElementById('find-text').value;
        if (!findText) return;

        const text = this.editor.innerText || this.editor.textContent;
        const index = text.toLowerCase().indexOf(findText.toLowerCase());
        
        if (index > -1) {
            this.highlightText(findText, index);
        } else {
            alert('Текст не найден');
        }
    }

    highlightText(text, index) {
        const selection = window.getSelection();
        const range = document.createRange();
        
        let charCount = 0;
        let foundNode = null;
        let foundOffset = 0;

        function findTextNode(node) {
            if (node.nodeType === 3) {
                const nodeText = node.textContent.toLowerCase();
                const textIndex = nodeText.indexOf(text.toLowerCase());
                
                if (textIndex > -1 && charCount <= index) {
                    foundNode = node;
                    foundOffset = textIndex;
                    return true;
                }
                charCount += nodeText.length;
            }
            
            for (let i = 0; i < node.childNodes.length; i++) {
                if (findTextNode(node.childNodes[i])) return true;
            }
            return false;
        }

        if (findTextNode(this.editor)) {
            range.setStart(foundNode, foundOffset);
            range.setEnd(foundNode, foundOffset + text.length);
            selection.removeAllRanges();
            selection.addRange(range);
            this.editor.focus();
        }
    }

    replaceText() {
        const findText = document.getElementById('find-text').value;
        const replaceText = document.getElementById('replace-text').value;
        
        if (!findText) return;

        const selection = window.getSelection();
        if (selection.toString().toLowerCase() === findText.toLowerCase()) {
            document.execCommand('insertText', false, replaceText);
        }
        this.findText();
    }

    replaceAllText() {
        const findText = document.getElementById('find-text').value;
        const replaceText = document.getElementById('replace-text').value;
        
        if (!findText) return;

        const content = this.editor.innerHTML;
        const regex = new RegExp(findText, 'gi');
        this.editor.innerHTML = content.replace(regex, replaceText);
    }
}

// Инициализация редактора
document.addEventListener('DOMContentLoaded', () => {
    const editor = new TextEditor();
    document.querySelector('.editor-container').__editor = editor;
});

// Закрытие модального окна при клике вне его
window.addEventListener('click', (event) => {
    const modal = document.getElementById('find-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Горячие клавиши
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'n':
                e.preventDefault();
                document.getElementById('new-file').click();
                break;
            case 'o':
                e.preventDefault();
                document.getElementById('open-file').click();
                break;
            case 's':
                e.preventDefault();
                if (e.shiftKey) {
                    document.getElementById('save-file').click();
                } else {
                    const editor = document.querySelector('.editor-container').__editor;
                    if (editor) editor.quickSave();
                }
                break;
            case 'p':
                e.preventDefault();
                document.getElementById('print').click();
                break;
            case 'z':
                e.preventDefault();
                document.getElementById('undo').click();
                break;
            case 'y':
                e.preventDefault();
                document.getElementById('redo').click();
                break;
            case 'f':
                e.preventDefault();
                document.getElementById('find').click();
                break;
        }
    }
});
