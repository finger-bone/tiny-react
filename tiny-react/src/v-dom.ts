export type VDomAttributes = { 
    key?: string | number
    style?: unknown
    [_: string]: unknown | undefined
}

export interface VDomElement {
  kind: 'element' | 'fragment'
  tag: string
  children?: VDomNode[]
  props?: VDomAttributes
  key: string | number | undefined
}

export type VDomNode = 
| string
| VDomElement

export function createElement(tag: string | Function, props: VDomAttributes, ...children: Array<VDomNode | Array<VDomNode>>): VDomElement {
    if (tag instanceof Function) {
        return tag(props, children)
    }
    return {
        kind: tag === '' ? 'fragment' : 'element',
        tag,
        children: children.flatMap((child) => Array.isArray(child) ? child : [child]),
        props: props ?? {},
        key: props?.key ?? undefined
    }
}

export const fragment = ''

export function isString(value: VDomNode): value is string {
    return typeof value === 'string'
}

export function isElement(value: VDomNode): value is VDomElement {
    return typeof value === 'object'
}

export function isFragment(value: VDomNode): value is VDomElement {
    return isElement(value) && value.kind === 'fragment'
}

export function createDom(vDom: VDomNode): HTMLElement | Text {
    if (isElement(vDom)) {
        const element = document.createElement(vDom.tag)
        Object.entries(vDom.props ?? {}).forEach(([name, value]) => {
            if (value === undefined) return
            if (name === 'key') return
            if (name === 'style') {
                Object.entries(value as Record<string, unknown>).forEach(([styleName, styleValue]) => {
                    element.style[styleName as any] = styleValue as any
                })
                return
            }
            if (name.startsWith('on') && value instanceof Function) {
                element.addEventListener(name.slice(2).toLowerCase(), value as EventListener)
            } else {
                element.setAttribute(name, value?.toString() ?? "")
            }
        })
        return element
    } else {
        return document.createTextNode(vDom)
    }
}

export function vDOMEquals(a: VDomNode, b: VDomNode): boolean {
    if (isString(a) && isString(b)) {
        return a === b
    } else if (isElement(a) && isElement(b)) {
        let ret = a.tag === b.tag && a.key === b.key
        if (!ret) return false
        if (a.props && b.props) {
            const aProps = a.props
            const bProps = b.props
            const aKeys = Object.keys(aProps)
            const bKeys = Object.keys(bProps)
            if (aKeys.length !== bKeys.length) return false
            for (let i = 0; i < aKeys.length; i++) {
                const key = aKeys[i]
                if (key === 'key') continue
                if (aProps[key] instanceof Function && bProps[key] instanceof Function) continue
                if (aProps[key] !== bProps[key]) return false
            }
            for (let i = 0; i < bKeys.length; i++) {
                const key = bKeys[i]
                if (key === 'key') continue
                if (aProps[key] instanceof Function && bProps[key] instanceof Function) continue
                if (aProps[key] !== bProps[key]) return false
            }
            return true
        } else {
            return a.props === b.props
        }
    } else {
        return false
    }
}