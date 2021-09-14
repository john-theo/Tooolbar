import {
    IBar, IIconBaseConfig, ITheme, IThemeConfig, IThemes, IToolConfig, IIconConfig,
    IBarChildConfig, ITool, IBarPart, IIcon, IBarConfig, AddableItemType
} from './interfaces';
import { assertProps, camelCaseToDash, removeNull } from './utils';
import { themes } from './theme';


export const childMap: { [key: string]: typeof BarChild } = {};
export const childNames = new Set<string>();

export function registerToolType(Class: typeof BarChild, aliases: string[]) {
    for (const alias of aliases) {
        childMap[alias] = Class;
    }
    childNames.add(Class.name);
}


const APP_NAME = process.env.APP_NAME!;

export class Bar implements IBar {
    $el: HTMLElement;
    iconBaseUrl: string;
    children: IBarPart[] = [];
    tooltip: 'top' | 'bottom';
    tools: { [id: string]: Tool } = {};

    constructor(config: IBarConfig) {
        assertProps(config, ['iconBaseUrl'])
        this.$el = document.createElement("ul");
        this.$el.classList.add(APP_NAME.toLowerCase());
        this.$el.classList.add('bar');
        this.tooltip = config.tooltip || 'bottom';
        this.iconBaseUrl = config.iconBaseUrl;
        let { width, height, align, vertical } = config;
        if (width) this.$el.style.width = width;
        if (height) this.$el.style.height = height;
        align = align || 'center';
        if (align === 'start' || align === 'end')
            align = 'flex-' + align
        this.$el.style.setProperty('--align', align);
        if (vertical)
            this.$el.setAttribute('vertical', '');
    }

    set theme(id: string) {
        themes.switch(id);
    }

    get theme() {
        return themes.current?.id || 'none';
    }

    static registerTheme(id: string, config: IThemeConfig): ITheme {
        return themes.register(id, config);
    }

    get themes(): IThemes {
        return themes;
    }

    bindTo(container: HTMLElement | string) {
        let el;
        if (typeof container === "string")
            el = document.querySelector(container)
        else
            el = container
        if (!el || !(el instanceof HTMLElement))
            throw Error("Container must be an HTML element or its css selector.")
        el.appendChild(this.$el);
        return this;
    }

    add(child: AddableItemType) {
        if (typeof child === "string")
            child = { type: child } as IBarChildConfig;
        if ('type' in child) {
            const Item = childMap[child.type];
            if (!Item || !childNames.has(Item.name))
                throw Error(`Unknown bar item name "${child.type}"!`)
            // @ts-expect-error
            child = new Item({ ...child, bar: this });
        }
        if (!(child instanceof BarChild))
            throw Error("Unknown bar item!")
        this.mount(child);
        return this;
    }

    get(id: string) {
        return this.tools[id];
    }

    mount(child: BarChild) {
        this.children.push(child);
        if (child instanceof Tool)
            this.tools[child.id] = child;
        this.$el.appendChild(child.$el);
    }

    addMany(children: AddableItemType[]) {
        children.forEach(child => this.add(child));
        return this;
    }

    load(children: AddableItemType[]) {
        this.clear();
        return this.addMany(children)
    }

    clear() {
        this.$el.innerHTML = "";
        this.children = [];
        this.tools = {};
        return this;
    }

    dump() {
        return Object.values(this.tools).map(tool => (tool.config))
    }

    getSvgLink(icon: string) {
        if (!this.iconBaseUrl)
            return icon
        return `${this.iconBaseUrl}/${icon}.svg#main`
    }

    addEventListener(type: any, listener: (ev: any) => any, options?: boolean | AddEventListenerOptions | undefined) {
        return this.$el.addEventListener<any>(type, listener, options);
    }

    dispatchEvent(event: Event) {
        return this.$el.dispatchEvent(event);
    }
}


export class Icon implements IIcon {
    $el: SVGSVGElement
    $bar: IBar
    icon: string
    key?: string
    label?: string
    iconShrink?: number;

    constructor(config: IIconConfig) {
        assertProps(config, ['icon']);
        const { icon, key, label, iconShrink: shrink, bar } = config;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add("icon");
        this.$el = svg;
        if (shrink && (typeof shrink) === "number" && shrink !== 0)
            svg.style.transform = `scale(${1 - 0.1 * shrink})`
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        this.$bar = bar;
        this.label = label;
        this.key = key;
        this.icon = icon;
        this.iconShrink = shrink;
        svg.appendChild(use);
        use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', bar.getSvgLink(icon));
    }

    mount() { }

    get config() {
        const { key, icon, label, iconShrink } = this;
        return removeNull({ key, icon, label, iconShrink }) as IIconBaseConfig
    }
}


export abstract class BarChild implements IBarPart {
    $el: HTMLElement
    $bar: IBar

    constructor(config: IBarChildConfig) {
        assertProps(config, ['type']);
        let { type, tag, bar } = config;
        const Child = childMap[type];
        if (!Child || !childNames.has(Child.name) || Child !== this.constructor)
            throw Error(`Type "${type}" not match!`)
        this.$el = document.createElement(tag || 'li');
        this.$el.classList.add(camelCaseToDash(this.constructor.name));
        this.$bar = bar;
        bar.mount(this);
    }

    mount(item: IBarPart) {
        this.$el.appendChild(item.$el);
        item.$el.classList.remove('tool');
    }

    clear() {
        this.$el.innerHTML = "";
    }
}

export class Tip {
    $el: HTMLElement;
    $target: HTMLElement;
    label: string = "";
    sublabel?: string;

    constructor(target: HTMLElement, config: {
        position: 'top' | 'bottom' | 'left' | 'right'
    }) {
        this.$target = target;
        this.$el = document.createElement("div");
        this.$el.classList.add('tip');
        this.$el.setAttribute('position', config.position);
        target.appendChild(this.$el);
        target.setAttribute('tip-target', '');
        target.addEventListener("mouseenter", () => {
            this.$el.setAttribute('show', '')
        })
        target.addEventListener("mouseleave", () => {
            this.$el.removeAttribute('show')
        })
    }

    setLabel(label?: string, sublabel?: string) {
        if (!label)
            return this.setContent();
        this.label = label;
        this.sublabel = sublabel;
        if (sublabel)
            label += `<br><span>${sublabel}</span>`;
        return this.setContent(label);
    }

    setContent(content?: string) {
        if (content) {
            this.$el.style.display = "";
            this.$el.innerHTML = content;
        } else {
            this.$el.style.display = "none";
        }
        return this;
    }

    get config() {
        const { label, sublabel } = this;
        return removeNull({ label, sublabel })
    }
}


export abstract class Tool extends BarChild implements ITool {
    _lastState: string = ""
    id: string
    disabled: boolean = false
    $tip: Tip

    constructor(config: IToolConfig) {
        super(config);
        assertProps(config, ['id']);
        const { label, sublabel, id, disabled, bar, listeners } = config;
        this.$el.classList.add('tool');
        if (config.class)
            this.$el.className += ' ' + config.class
        this.id = id;
        this.$tip = new Tip(this.$el, { position: bar.tooltip || 'bottom' })
        this.$tip.setLabel(label, sublabel);
        if (disabled)
            this.disable();
        if (listeners) {
            for (const [name, handler] of Object.entries(listeners)) {
                this.addEventListener(name, handler.bind(this));
            }
        }
    }

    disable() {
        this.$el.classList.add("disabled");
        this.disabled = true;
        return this;
    }

    enable() {
        this.$el.classList.remove("disabled");
        this.disabled = false;
        return this;
    }

    addEventListener(type: any, listener: (ev: any) => any, options?: boolean | AddEventListenerOptions | undefined) {
        return this.$el.addEventListener<any>(type, listener, options);
    }

    dispatchEvent(event: Event) {
        return this.$el.dispatchEvent(event);
    }

    get _config() {
        return {
            id: this.id,
            type: this.constructor.name,
            ...this.$tip.config
        }
    }

    get config() {
        return this._config
    }

    abstract get value(): any
    get _state() {
        return this.value.toString();
    }

    clear() {
        this.$el.removeChild(this.$tip.$el);
        this.$el.innerHTML = "";
        this.$el.appendChild(this.$tip.$el);
    }

    emitEvent(type: string, el?: HTMLElement, oriEvent?: Event, stateDependent: boolean = false) {
        if (oriEvent instanceof CustomEvent)
            return;
        oriEvent && oriEvent.stopPropagation() && oriEvent.preventDefault();
        if (stateDependent) {
            if (this._state === this._lastState)
                return;
            this._lastState = this._state;
        }
        if (this.disabled) return;
        return this.dispatchEvent(new CustomEvent(type, {
            bubbles: true,
            cancelable: true,
            detail: {
                el: el || this.$el,
                target: this,
                type: type,
                id: this.id,
                value: this.value,
                _e: oriEvent
            }
        }));
    }

    cancelClickEvent() {
        // TODO: is this necessary?
        this.$el.addEventListener("click", (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
        });
    }
}
