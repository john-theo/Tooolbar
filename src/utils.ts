export function assertProps(obj: object, props: string[]) {
    for (const prop of props)
        if (!obj.hasOwnProperty(prop))
            throw Error(`${obj.constructor.name} must have property "${prop}"!`)
}

export function camelCaseToDash(str: string) {
    return str[0].toLowerCase()+str.slice(1).replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
}

export function removeNull(obj: { [key: string|number]: any}) {
    return Object.fromEntries(Object.entries(obj).filter(([k, v]) => (k && v)))
}

export function isFunction(obj: any) {
    return obj && {}.toString.call(obj) === '[object Function]';
}


export class Limiter {
    private _lastVal: number;
    private _value: number;
    max: number;
    min: number;
    circle: boolean = false;
    cb?: (val: number, init: boolean) => void;

    constructor(config: { min: number, max: number, value: number, step?: number, circle?: boolean, cb?: (val: number, init: boolean) => void }) {
        this._value = config.value;
        this._lastVal = config.value;
        this.max = config.max;
        this.min = config.min;
        this.circle = !!config.circle;
        this.value = config.value;
        this.cb = config.cb;
        this.cb && this.cb(this._value, true);
    }

    get value() {
        return this._value;
    }

    get span() {
        return this.max - this.min;
    }

    get length() {
        return Math.ceil(this.span+0.000001)
    }

    set value(newVal: number) {
        if (newVal < this.min) {
            if (this.circle)
                this._value = Math.ceil((this.min - newVal) / this.span) * this.span + newVal + 1;
            else
                this._value = this.min;
        }
        else if (newVal > this.max)
            if (this.circle)
                this._value = newVal - Math.ceil((newVal - this.max) / this.span) * this.span - 1;
            else
                this._value = this.max;
        else
            this._value = newVal;
        if (this._value !== this._lastVal) {
            this.cb && this.cb(this._value, false);
            this._lastVal = this._value;
        }
    }

    inc() {
        this.value += 1;
    }

    dec() {
        this.value -= 1;
    }

    get config() {
        const { min, max, circle } = this;
        return { min, max, circle }
    }
}


export function merge<T extends Record<string, any>>(objFrom: T, objTo: T): T {
    return Object.keys(objFrom)
        .reduce(
            (merged, key) => {
                // @ts-expect-error
                merged[key] = objFrom[key] instanceof Object && !Array.isArray(objFrom[key])
                    ? merge(objFrom[key], merged[key] ?? {})
                    : objFrom[key]
                return merged
            }, { ...objTo }
        )
}
