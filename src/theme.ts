import { ITheme, IThemeConfig, IThemes } from './interfaces';
import { merge } from './utils';


const APP_NAME = process.env.APP_NAME!.toLowerCase();

const _light: IThemeConfig = {
    color: {
        text: {
            normal: "#777",
            markup: "#bbb",
        },
        bar: {
            background: "#f9f9f9",
            outline: "#e3e3e3",
        },
        tip: {
            background: "white",
        },
        tool: {
            active: "#dbdbdb",
            hover: "#e3e3e3",
        }
    }
}

const _dark: IThemeConfig = {
    color: {
        text: {
            normal: "#dbdbdb",
            markup: "#858585",
        },
        bar: {
            background: "#2d2d2d",
            outline: "#3c3c3c",
        },
        tip: {
            background: "#4d4d4d",
        },
        tool: {
            active: "#4d4d4d",
            hover: "#3c3c3c",
        }
    }
}

const _slack: IThemeConfig = {
    size: {
        bar: {
            padding: 20,
            height: "100%",
            width: "100%",
        },
        tool: {
            button: 32,
            icon: 18,
            radius: 8,
        },
        tip: {
            padding: "10px 16px",
            offset: 10,
        },
        text: {
            input: 13,
            label: 14,
            sublabel: 12,
        }
    }
}

const _default: IThemeConfig = {..._light, ..._slack};


const cssVarNameMap = {
    size: 's',
    color: 'c',

    bar: 'b',
    tool: 't',
    text: 'x',
    tip: 'p',

    padding: 'p',
    offset: 'o',
    height: 'h',
    width: 'w',
    button: 'b',
    icon: 'i',
    radius: 'r',
    input: 'i',
    label: 'l',
    sublabel: 's',
    normal: 'n',
    active: 'a',
    markup: 'm',
    background: 'b',
    outline: 'o',
    hover: 'h'
}

const km = cssVarNameMap;


class Theme implements ITheme  {
    id: string
    config: IThemeConfig
    $el: HTMLStyleElement

    constructor(id: string, theme: IThemeConfig) {
        this.config = merge(theme, _default);
        this.id = id;
        this.$el = document.createElement('style');
        this.$el.id = `${APP_NAME}-theme-${this.id}`;
        this.$el.textContent = this.css;
    }

    get css() {
        const lines: string[] = [];
        for (const [tk, tv] of Object.entries(this.config)) {
            for (const [ck, cv] of Object.entries(tv)) {
                // @ts-expect-error
                for (let [sk, sv] of Object.entries(cv)) {
                    if (Number.isInteger(sv))
                        sv = sv + 'px'
                    // @ts-expect-error
                    lines.push(`--x-${km[tk]}${km[ck]}${km[sk]}: ${sv};`)
                }
            }
        }
        return ':root {\n' + lines.join('\n') + '\n}';
    }

    mount() {
        document.head.appendChild(this.$el);
    }

    unmount() {
        this.$el?.parentElement?.removeChild(this.$el);
    }
}

class Themes implements IThemes {
    items: Record<string, Theme> = {}
    current?: Theme

    constructor() {
        this.register('light', {});
        this.register('dark', _dark);
        this.switch('light');
    }

    switch(id: string) {
        if (!(id in this.items))
            throw Error(`Unknown theme "${id}"!`)
        const theme = this.items[id]!;
        if (this.current)
            this.current.unmount();
        this.current = theme;
        theme.mount();
    }

    get(id: string) {
        return this.items[id]
    }

    register(id: string, theme: IThemeConfig | Theme) {
        if (!(theme instanceof Theme))
            theme = new Theme(id, theme);
        this.items[id] = theme;
        return theme;
    }
}

export const themes = new Themes();