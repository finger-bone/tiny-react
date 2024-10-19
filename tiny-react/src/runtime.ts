import { createDom, isElement, isFragment, vDOMEquals, VDomNode } from "./v-dom"

interface Fiber {
    parent: Fiber | null
    sibling: Fiber | null
    child: Fiber | null
    vDom: VDomNode
    dom: HTMLElement | Text | null
    alternate: Fiber | null
    committed: boolean
}

let nextUnitOfWork: Fiber | null = null
let wip: Fiber | null = null
let wipParent: HTMLElement | null = null
let oldFiber: Fiber | null = null

function commit() {
    function findNonFragmentParent(fiber: Fiber): Fiber | null {
        let parent = fiber.parent
        while(parent && isFragment(parent.vDom)) {
            parent = parent.parent!
        }
        return parent
    }

    function append(fiber: Fiber) {
        if(isFragment(fiber.vDom)) return;

        if(fiber.dom && fiber.parent?.dom) {
            fiber.parent?.dom?.appendChild(fiber.dom)
            fiber.committed = true
        }
        
        if(fiber.dom && fiber.parent && isFragment(fiber.parent.vDom) && !fiber.committed) {
            const parent = findNonFragmentParent(fiber);
            parent?.dom?.appendChild(fiber.dom!)
            fiber.committed = true
        }
    }

    function commitToParent(fiber: Fiber | null) {
        if(!fiber) {
            return
        }

        if(!fiber.alternate && !isFragment(fiber.vDom)) {
            console.log(fiber.vDom)
            fiber.dom = createDom(fiber.vDom)
            append(fiber)
        }
        if(fiber.alternate && vDOMEquals(fiber.vDom, fiber.alternate.vDom)) {
            fiber.dom = fiber.alternate.dom
            append(fiber)
        }
        if(fiber.alternate && !vDOMEquals(fiber.vDom, fiber.alternate.vDom) && !isFragment(fiber.vDom)) {
            fiber.dom = createDom(fiber.vDom)
            fiber.alternate.dom?.replaceWith(fiber.dom)
            append(fiber)
        }


        function recursiveRemoveRelated(fiber: Fiber | null) {
            if(!fiber) {
                return
            }
            if(fiber.sibling) {
                recursiveRemoveRelated(fiber.sibling)
                fiber.sibling.dom?.remove()
            }
            if(fiber.child) {
                recursiveRemoveRelated(fiber.child)
                fiber.child.dom?.remove()
            }
        }
        if(fiber.alternate?.child && !fiber.child) {
            recursiveRemoveRelated(fiber.alternate.child)
            fiber.alternate.child.dom?.remove()
        }
        if(fiber.alternate?.sibling && !fiber.sibling) {
            recursiveRemoveRelated(fiber.alternate.sibling)
            fiber.alternate.sibling.dom?.remove()
        }

        commitToParent(fiber.child)
        commitToParent(fiber.sibling)
    }
    commitToParent(wip)
    wipParent?.appendChild(wip!.dom!)
    wip!.committed = true
    oldFiber = wip
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

function timeoutWorkLoop() {
  while (nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    if(!nextUnitOfWork && wip) {
        commit()
    }
  }
  setTimeout(timeoutWorkLoop, 0)
}

try {
    requestIdleCallback(workLoop)
}
catch {
    setTimeout(timeoutWorkLoop, 0)
}

function reconcile(fiber: Fiber) {
    if (isElement(fiber.vDom)) {
        const elements = fiber.vDom.children ?? []
        let index = 0
        let prevSibling = null
        
        let currentOldFiber = fiber.alternate?.child ?? null
        while (index < elements.length) {
            const element = elements[index]
            const newFiber: Fiber = {
                parent: fiber,
                dom: null,
                sibling: null,
                child: null,
                vDom: element,
                committed: false,
                alternate: currentOldFiber,
            }

            if (index === 0) {
                fiber.child = newFiber
            } else {
                prevSibling!.sibling = newFiber
            }
            prevSibling = newFiber
            currentOldFiber = currentOldFiber?.sibling ?? null
            index++
        }
    }
}

function performUnitOfWork(nextUnitOfWork: Fiber | null): Fiber | null {
    if(!nextUnitOfWork) {
        return null
    }
    const fiber = nextUnitOfWork

    reconcile(fiber)

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
        committed: false,
        alternate: oldFiber,
    }
    wipParent = parent
    nextUnitOfWork = wip
}