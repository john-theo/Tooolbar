const {
    registerToolType,
    Tool,
    assertProps,
    Icon
} = Tooolbar;


class IconSwitcher extends Tool {
    iconMap = {};
    iconNames = [];
    label;

    constructor(config) {
        super(config);
        const { bar, current, label } = config;
        if (config.icons.length !== 2)
            throw Errror("Icon switcher must have exact 2 icons!")
        this.label = label;
        config.icons.forEach((ic) => {
            assertProps(ic, ['label', 'key'])
            const icon = new Icon({ ...ic, bar })
            this.iconMap[icon.key] = icon;
            this.iconNames.push(icon.key);
        })
        const value = this.iconNames.indexOf(current);
        this._lastState = value;
        this.render();
        if (value < 0)
            throw Error("Current icon does not exist in icons!")
        this.$el.addEventListener("click", (e) => {
            this._lastState = 1 - this._lastState;
            this.render();
            this.emitEvent("change", undefined, e);
        });
    }

    render() {
        this.clear();
        const icon = this.iconMap[this.value];
        this.mount(icon);
        this.$tip.setLabel(this.label, icon.label);
    }

    get value() {
        return this.iconNames[this._lastState];
    }

    get config() {
        return {
            ...this._config,
            icons: Object.values(this.iconMap).map(icon => icon.config),
            current: this.value
        }
    }
}

registerToolType(IconSwitcher, ["iw", "icon-switcher", "IconSwitcher"])