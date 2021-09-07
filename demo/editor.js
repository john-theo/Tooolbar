let initialVersion;
let currentVersion;
let lastVersion;

require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@latest/min/vs' } });
require(['vs/editor/editor.main'], function () {
    window.$editor = monaco.editor;
    const editor = monaco.editor.create(document.getElementById('monaco_editor'), {
        value: JSON.stringify(config, null, '    '),
        language: 'json',
        scrollBeyondLastLine: false,
        fontSize: 13,
        minimap: {
            enabled: false
        }
    });
    window.editor = editor;
    editor.focus();
    initialVersion = editor.getModel().getAlternativeVersionId();
    editor.onDidChangeModelContent(e => {
        const versionId = editor.getModel().getAlternativeVersionId();
        // undoing
        if (versionId < currentVersion) {
            changeButtonEnabled('redo', true);
            // no more undo possible
            if (versionId === initialVersion) {
                changeButtonEnabled('undo', false);
            }
        } else {
            // redoing
            if (versionId <= lastVersion) {
                // redoing the last change
                if (versionId == lastVersion) {
                    changeButtonEnabled('redo', false);
                }
            } else { // adding new change, disable redo when adding new changes
                changeButtonEnabled('redo', false);
                if (currentVersion > lastVersion) {
                    lastVersion = currentVersion;
                }
            }
            changeButtonEnabled('undo', true);
        }
        currentVersion = versionId;
    });
});