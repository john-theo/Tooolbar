export type ToolEventName = 'click' | 'change';
export type EventCallback = (e: CustomEvent) => {};

export type AddableItemType = IBarChild | IBarChildConfig | string;


export interface IBarPart {
    $el: Element;
    $bar: IBar

    mount(item: IBarPart): void
}
export interface IBarPartConfig {
    bar: IBar
}

export interface IIcon extends IBarPart {
    $el: SVGSVGElement
    icon: string
    key?: string
    label?: string
    iconShrink?: number
    get config(): IIconBaseConfig
}

export interface IIconBaseConfig {
    icon: string
    key?: string
    label?: string
    iconShrink?: number
}

export interface IIconConfig extends IIconBaseConfig, IBarPartConfig { }

export interface IToolEventDetail {
    el: HTMLElement
    target: ITool
    event: string
    id: string
    value: any
}

export interface IBarChildConfig extends IBarPartConfig {
    type: string
    tag?: string
}

export interface IBarChild extends IBarPart { };
export interface ITool extends IBarPart {
    id: string
    disabled: boolean
}
export interface IToolConfig extends IBarChildConfig {
    id: string
    label?: string
    class?: string
    sublabel?: string
    disabled?: boolean
}

export interface IBarConfig {
    iconBaseUrl: string
    width: string
    height: string
    tooltip: 'top' | 'bottom'
}

export interface IBar {
    $el: HTMLElement
    iconBaseUrl: string
    children: IBarChild[]
    tooltip?: 'top' | 'bottom'

    get theme(): string
    get themes(): IThemes
    bindTo(container: HTMLElement): IBar
    mount(child: IBarChild): void
    add(child: AddableItemType): IBar
    addMany(children: AddableItemType[]): IBar
    load(children: AddableItemType[]): IBar
    getSvgLink(icon: string): string
}

export interface IIconsToolConfig extends IToolConfig {
    icons: IIconBaseConfig[]
    current: string
    circle: boolean
}

export type CssSizeValue = string | number;
export type CssColorValue = string;
export type CssValue = CssColorValue | CssSizeValue;

export interface IThemeConfig {
    size?: {
        bar?: {
            padding?: CssSizeValue;
            height?: CssSizeValue;
            width?: CssSizeValue;
        },
        tool?: {
            button?: CssSizeValue;
            icon?: CssSizeValue;
            radius?: CssSizeValue;
            margin?: CssSizeValue;
        },
        tip?: {
            padding?: CssSizeValue;
            offset?: CssSizeValue;
        },
        text?: {
            input?: CssSizeValue;
            label?: CssSizeValue;
            sublabel?: CssSizeValue;
        }
    },
    color?: {
        text?: {
            normal?: CssColorValue;
            markup?: CssColorValue;
        },
        bar?: {
            background?: CssColorValue;
            outline?: CssColorValue;
        },
        tip?: {
            background?: CssColorValue;
        },
        tool?: {
            active?: CssColorValue;
            hover?: CssColorValue;
        }
    }
}

export interface ITheme {
    id: string
    config: IThemeConfig
    $el: HTMLStyleElement
}

export interface IThemes {
    items: Record<string, ITheme>
    current?: ITheme
}