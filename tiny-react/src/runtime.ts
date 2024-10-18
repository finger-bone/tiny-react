import { createDom, isElement, VDomNode } from "./v-dom"

interface Fiber {
    parent: Fiber | null
    sibling: Fiber | null
    child: Fiber | null
    vDom: VDomNode
    dom: HTMLElement | Text | DocumentFragment | null
}

let nextUnitOfWork: Fiber | null = null
let wip: Fiber | null = null
let wipParent: HTMLElement | null = null
let previousFiber: Fiber | null = null

function commit() {
    function commitChildren(fiber: Fiber | null) {
        if(!fiber) {
            return
        }
        if(fiber.dom && fiber.parent?.dom) {
            fiber.parent.dom.appendChild(fiber.dom)
        }
        commitChildren(fiber.child)
        commitChildren(fiber.sibling)
    }
    commitChildren(wip)
    wipParent?.appendChild(wip!.dom!)
    previousFiber = wip
    wip = null
}

function workLoop(deadline: IdleDeadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    if(!nextUnitOfWork && wip) {
        commit()
    }
    shouldYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(nextUnitOfWork: Fiber | null): Fiber | null {
    if(!nextUnitOfWork) {
        return null
    }
    const fiber = nextUnitOfWork
    const isFragment = isElement(fiber.vDom) && fiber.vDom.tag === '' && fiber.vDom.kind === 'fragment'

    if(!fiber.dom && !isFragment) {
        fiber.dom = createDom(fiber.vDom)
    }

    if (isElement(fiber.vDom)) {
        const elements = fiber.vDom.children ?? []
        let index = 0
        let prevSibling = null
        
        while (index < elements.length) {
            const element = elements[index]
            const newFiber: Fiber = {
                parent: isFragment ? fiber.parent : fiber,
                dom: null,
                sibling: null,
                child: null,
                vDom: element,
            }

            if (index === 0) {
                fiber.child = newFiber
            } else {
                prevSibling!.sibling = newFiber
            }
            prevSibling = newFiber
            index++
        }
    }
    
    if (fiber.child) {
        return fiber.child
    }
    let nextFiber: Fiber | null = fiber
    while (nextFiber) {
        if (nextFiber.sibling) {
          return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
    return null
}

export function render(vDom: VDomNode, parent: HTMLElement) {
    wip = {
        parent: null,
        sibling: null,
        child: null,
        vDom: vDom,
        dom: null,
    }
    wipParent = parent
    nextUnitOfWork = wip
}