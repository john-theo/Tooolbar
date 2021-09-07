const config = [
    {
        id: "undo", type: 'ib', icon: "arrow-back", label: "Undo"
    },
    {
        id: "redo", type: 'ib', icon: "arrow-forward", label: "Redo"
    },
    '|',
    {
        id: "size", type: "ic2", icon: "grid", label: "Table Size",
        min1: 1, max1: 20, value1: 8, label1: "Row",
        min2: 1, max2: 20, value2: 12, label2: "Column"
    },
    '|',
    { id: "image", type: 'ib', icon: "image", label: "Normal Button" },
    { id: "file", type: 'ib', icon: "file", label: "Custom ClassName", class: "red" },
    { id: "game", type: 'ib', icon: "paper", label: "Disabled Button", disabled: true },
    '|',
    {
        id: "volume", type: "ic", icon: "sound-on", label: "Hover & Scroll",
        min: 12, max: 30, value: 14
    },
    {
        id: "alignH", type: 'is', circle: true, icons: [
            { "key": "left", "icon": "text-align-left", "label": "Left" },
            { "key": "center", "icon": "text-align-center", "label": "Center" },
            { "key": "right", "icon": "text-align-right", "label": "Right" },
            { "key": "right", "icon": "text-align-justified", "label": "Right" },
        ], label: "Circular Scroll", current: "left"
    },
    {
        id: "alignV", type: 'is', icons: [
            { "key": "top", "icon": "align-to-top", "label": "Top" },
            { "key": "middle", "icon": "align-to-middle", "label": "Middle" },
            { "key": "bottom", "icon": "align-to-bottom", "label": "Bottom" },
        ], label: "Limited Scroll", current: "middle"
    },
    {
        id: "clear", type: "ib", icon: "air", label: "Clear Logs",
    },
    "|",
    { id: "run", type: 'ib', icon: "play", label: "Render From Editor" },
    { id: "save", type: 'ib', icon: "trash-bin", label: "Save" },
    {
        id: "dark", type: 'iw', icons: [
            { "key": "on", "icon": "moon", "label": "On" },
            { "key": "off", "icon": "sun", "label": "Off" }
        ], label: "Dark Mode", current: "off"
    },
];


const container = document.getElementById("container");

const { Bar } = Tooolbar;


const bar = new Bar({ iconBaseUrl: "../assets/icon", width: "100%", tooltip: 'bottom' })
    .bindTo(container)
    .load(config);


function toggleDarkMode(bar) {
    if (bar.theme === 'light') {
        bar.theme = 'dark';
        document.body.classList.add('dark');
        $editor.setTheme('vs-dark');
    } else {
        bar.theme = 'light';
        document.body.classList.remove('dark');
        $editor.setTheme('vs');
    }
}


function changeButtonEnabled(name, enable) {
    const button = bar.get(name);
    if (!button) return;
    if (enable)
        button.enable()
    else
        button.disable();
}


function addButtonInteractions() {
    bar.get('dark') && bar.get('dark').addEventListener('click', (e) => {
        toggleDarkMode(bar);
    })
    bar.get('clear') && bar.get('clear').addEventListener('click', (e) => {
        console.log(e.detail)
        events.innerHTML = ""
    })
    bar.get('alignH') && bar.get('alignH').addEventListener('input', (e) => {
        events.style.textAlign = e.detail.value;
    })
    bar.get('volume') && bar.get('volume').addEventListener('change', (e) => {
        events.style.fontSize = e.detail.value + 'px';
    })
    bar.get('undo') && bar.get('undo').disable().addEventListener('click', (e) => {
        editor.trigger('', 'undo');
        editor.focus();
    })
    bar.get('redo') && bar.get('redo').disable().addEventListener('click', (e) => {
        editor.trigger('', 'redo');
        editor.focus();
    })
    bar.get('save') && bar.get('save').addEventListener('click', (e) => {
        logEvent("Bar", "dump", JSON.stringify(bar.dump()).slice(0, 200) + '...')
    })
    bar.get('run') && bar.get('run').addEventListener('click', (e) => {
        let config;
        try {
            config = JSON.parse(window.editor.getValue())
        } catch {
            window.alert("JSON Syntax Error!");
            return;
        }
        events.innerHTML = "";
        bar.load(config);
        addButtonInteractions();
    });
}


addButtonInteractions();


const events = document.getElementById("events");

function logEvent(tool, type, newValue) {
    const date = new Date();
    const options = { hour: "2-digit", minute: "2-digit" };
    events.innerHTML += `<div><span time>${date.toLocaleTimeString("en-us", options)}</span>Tool "<strong>${tool}</strong>" <span ${type}>${type}</span>` + (newValue ? ` to "<strong>${newValue}</strong>"</div>` : '');
    events.scrollTo(0, events.scrollHeight);
}
function logBarEvent(e) {
    if (!(e instanceof CustomEvent))
        return;
    const { type, id, value } = e.detail;
    logEvent(id, type, value);
}

bar.addEventListener("input", logBarEvent);
bar.addEventListener("change", logBarEvent);
bar.addEventListener("click", logBarEvent);