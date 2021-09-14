import { registerToolType } from '.';
import { BarChild, Icon, Tool } from './core';
import { IBarChildConfig, IIcon, IIconConfig, IIconsToolConfig, IToolConfig } from './interfaces';
import { assertProps, Limiter } from './utils';


export interface IDividerConfig extends IBarChildConfig {
    height?: number | string;
    margin?: number | string;
}

export class Divider extends BarChild {
    constructor(config: IDividerConfig) {
        let { height, margin } = config;
        super({ ...config, tag: 'li' });
        height = height || "40%";
        margin = margin || "20px";
        if (typeof height === 'number')
            height = height + 'px';
        if (typeof margin === 'number')
            margin = margin + 'px';
        this.$el.style.height = height;
        this.$el.style.margin = "0 " + margin;
    }
}

export interface ISpacerConfig extends IBarChildConfig {
    width?: number | string;
}

export class Spacer extends BarChild {
    constructor(config: ISpacerConfig) {
        let { width } = config;
        super({ ...config, tag: 'li' });
        width = width || 20;
        if (typeof width === 'number')
            width = width.toString() + 'px';
        this.$el.style.width = width;
    }
}

export interface ICounterConfig extends IToolConfig {
    min: number
    max: number
    value: number
    step?: number
    circle?: boolean
    target?: HTMLElement
}


export class Counter extends Tool {
    $limiter: Limiter;
    $input: HTMLElement;

    constructor(config: ICounterConfig) {
        super({ ...config, tag: 'li' });
        assertProps(config, ['min', 'max', 'value']);
        const { min, max } = config;
        this.$input = document.createElement('input');
        this.$input.setAttribute("type", "number");
        this.$input.setAttribute("min", min.toString());
        this.$input.setAttribute("max", max.toString());
        this.$limiter = new Limiter({
            ...config, cb: (val, init) => {
                this.$input.setAttribute("value", val.toString());
                (!init) && this.emitEvent("input");
            }
        });
        this.$el.appendChild(this.$input);
        const eventTarget = config.target || this.$el;
        eventTarget.addEventListener("wheel", (e) => {
            e.deltaY < 0 ? this.$limiter.inc() : this.$limiter.dec();
            e.preventDefault();
        });
        this._lastState = this._state;
    }

    get value() {
        return this.$limiter.value;
    }

    get _state() {
        return this.value.toString();
    }

    set value(newVal: number) {
        this.$limiter.value = newVal;
    }

    get config() {
        return {
            ...this._config,
            ...this.$limiter.config,
            value: this.value
        }
    }
}

export interface IIconButtonConfig extends IToolConfig, IIconConfig { }


export class IconButton extends Tool {
    $icon: Icon;

    constructor(config: IIconButtonConfig) {
        super({ ...config, tag: "li" })
        this.$icon = new Icon(config);
        this.mount(this.$icon);
        this.$el.addEventListener("click", (e: Event) => {
            this.emitEvent("click", undefined, e);
        }, true)
    }

    get config() {
        return {
            ...this.$icon.config,
            ...this._config,
            icon: this.$icon.icon,
        }
    }

    get value() {
        return null
    }
}


export interface IIconCounterConfig extends ICounterConfig, IIconConfig { };

export class IconCounter extends Tool {
    $counter: Counter;
    $icon: IIcon;

    constructor(config: IIconCounterConfig) {
        super({ ...config, tag: "li" });
        this.$icon = new Icon(config);
        this.mount(this.$icon);
        this.$counter = new Counter({
            ...config, type: "c", label: undefined, target: this.$el
        });
        this.mount(this.$counter);
        this.$el.addEventListener("mouseleave", (e: Event) => {
            this.emitEvent("change", undefined, e, true);
        });
        this._lastState = this._state;
        this.cancelClickEvent();
    }

    get value() {
        return this.$counter.value;
    }

    get config() {
        return {
            ...this.$icon.config,
            ...this.$counter.config,
            ...this._config,
        }
    }
}


export interface IIconCounterConfig2 extends IToolConfig, IIconConfig {
    min1: number
    max1: number
    value1: number
    label1?: string
    min2: number
    max2: number
    value2: number
    label2?: string
    label?: string,
    sep?: string
}

export class IconCounter2 extends Tool {
    $icon: Icon;
    $counter1: Counter;
    $counter2: Counter;

    constructor(config: IIconCounterConfig2) {
        assertProps(config, ['min1', 'max1', 'value1', 'min2', 'max2', 'value2']);
        const {
            id, bar, sep, label,
            min1, min2, max1, max2, value1, value2, label1, label2
        } = config;
        let labelOuter = undefined;
        if (label && !label1 && !label2)
            labelOuter = label;
        super({ ...config, label: labelOuter, tag: 'li' });
        this.$icon = new Icon(config);
        this.mount(this.$icon);
        this.$counter1 = new Counter({
            min: min1, max: max1, value: value1, type: "c", tag: "input",
            sublabel: label1, id: id + '-1', label, bar
        });
        this.mount(this.$counter1);
        const span = document.createElement("span");
        span.innerText = sep || "×";
        this.$el.appendChild(span);
        this.$counter2 = new Counter({
            min: min2, max: max2, value: value2, type: "c", tag: "input",
            sublabel: label2, id: id + '-2', label, bar
        });
        this.mount(this.$counter2);
        const mergedListener = (e: Event) => {
            this.emitEvent("input", e.target as HTMLElement, e);
        }
        this.$counter1.addEventListener("input", mergedListener);
        this.$counter2.addEventListener("input", mergedListener);
        this.$el.addEventListener("mouseleave", (e: Event) => {
            this.emitEvent("change", undefined, e, true);
        });
        this._lastState = this._state;
        this.cancelClickEvent();
    }

    get value() {
        return [this.$counter1.value, this.$counter2.value];
    }

    get _state() {
        return this.value.join('-');
    }

    get config() {
        const { min: min1, max: max1, value: value1 } = this.$counter1.config;
        const { min: min2, max: max2, value: value2 } = this.$counter2.config;
        const label1 = this.$counter1.$tip?.sublabel;
        const label2 = this.$counter2.$tip?.sublabel;
        return {
            ...this._config,
            ...this.$icon.config,
            label: this.$counter1.$tip?.label,
            ...{ min1, min2, max1, max2, value1, value2, label1, label2 }
        }
    }
}

abstract class IconsTool extends Tool {
    iconMap: { [key: string]: IIcon } = {};
    iconNames: string[] = [];
    $limiter: Limiter;

    constructor(config: IIconsToolConfig) {
        super({ ...config, label: config.label, tag: 'li' });
        const { bar, current, circle, label } = config;
        config.icons.forEach((ic) => {
            assertProps(ic, ['label', 'key'])
            const icon = new Icon({ ...ic, bar })
            this.iconMap[icon.key!] = icon;
            this.iconNames.push(icon.key!);
        })
        const value = this.iconNames.indexOf(current);
        if (value < 0)
            throw Error("Current icon does not exist in icons!")
        this.$limiter = new Limiter({
            min: 0, max: this.iconNames.length - 1, value, circle: circle,
            cb: (val, init) => {
                this.clear();
                const icon = this.iconMap[this.iconNames[val]];
                this.mount(icon);
                this.$tip.setLabel(label, icon.label);
                (!init) && this.emitEvent("input");
            }
        });
        this._lastState = this._state;
        this.cancelClickEvent();
    }

    get value() {
        return this.iconNames[this.$limiter.value];
    }

    get config() {
        return {
            ...this._config,
            icons: Object.values(this.iconMap).map(icon => icon.config),
            current: this.iconNames[this.$limiter.value]
        }
    }
}

export class IconScroller extends IconsTool {
    constructor(config: IIconsToolConfig) {
        super(config)
        this.$el.addEventListener("wheel", (e) => {
            e.deltaY < 0 ? this.$limiter.inc() : this.$limiter.dec();
            e.preventDefault();
        });
        this.$el.addEventListener("mouseleave", (e: Event) => {
            this.emitEvent("change", undefined, e, true);
        });
    }
}


class IconSwitcher extends IconsTool {
    constructor(config: IIconsToolConfig) {
        super({ ...config, circle: true });
        if (config.icons.length !== 2)
            throw Error("Icon switcher must have exact 2 icons!")
        this.$el.addEventListener("click", (e) => {
            this.$limiter.inc();
            this.emitEvent("change", undefined, e);
        });
    }
}


export function registerAll() {
    registerToolType(IconButton, ["ib", "icon-button", "IconButton"]);
    registerToolType(Divider, ['|', 'd', 'divider', 'Divider']);
    registerToolType(Spacer, ['-', 's', 'spacer', 'Spacer']);
    registerToolType(Counter, ['c', 'counter', 'Counter']);
    registerToolType(IconCounter, ['ic', 'icon-counter', 'IconCounter']);
    registerToolType(IconCounter2, ['ic2', 'icon-counter2', 'IconCounter2']);
    registerToolType(IconScroller, ['is', 'icon-scroller', 'IconScroller']);
    registerToolType(IconSwitcher, ["iw", "icon-switcher", "IconSwitcher"]);
}