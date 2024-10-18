export type VDomAttributes = { 
    key?: string | number
    [_: string]: string | number | boolean | Function | undefined
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

export function createElement(tag: string | Function, props: VDomAttributes, ...children: VDomNode[]): VDomElement {
    if (tag instanceof Function) {
        return tag(props, children)
    }
    return {
        kind: tag === '' ? 'fragment' : 'element',
        tag,
        children,
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

export function createDom(vDom: VDomNode): HTMLElement | Text {
    if (isString(vDom)) {
        return document.createTextNode(vDom)
    } else if (isElement(vDom)) {
        const element = document.createElement(vDom.tag)
        Object.entries(vDom.props ?? {}).forEach(([name, value]) => {
            if (value === undefined) return
            if (name === 'key') return
            if (name.startsWith('on') && value instanceof Function) {
                element.addEventListener(name.slice(2).toLowerCase(), value as EventListener)
            } else {
                element.setAttribute(name, value.toString())
            }
        })
        return element
    } else {
        throw new Error('Unexpected vDom type')
    }
}