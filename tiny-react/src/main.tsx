import { render } from "./runtime";
import { createElement, fragment, VDomAttributes, VDomNode } from "./v-dom";

type FuncComponent = (props: VDomAttributes, children: VDomNode[]) => JSX.Element

const Wrapper: FuncComponent = (_: VDomAttributes, __: VDomNode[]) => {
    return <div>
        <>
            <div>
                <>
                    <li>
                        <span>1</span>
                        <div>
                            <>
                                <p>2</p>
                            </>
                        </div>
                    </li>
                </>
            </div>
        </>
    </div>
}
const app = document.getElementById('app')
const vDom: VDomNode = Wrapper({}, []) as unknown as VDomNode
console.log(vDom)
render(vDom, app!)
