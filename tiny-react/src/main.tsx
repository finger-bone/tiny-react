import { render } from "./runtime";
import { createElement, fragment, VDomAttributes, VDomNode } from "./v-dom";

type FuncComponent = (props: VDomAttributes, children: VDomNode[]) => JSX.Element

const App: FuncComponent = (props: VDomAttributes, __: VDomNode[]) => {
    return <div>
            {
                props["show"] ? <h2>show</h2> : <></>
            }
            <ul>
                {
                    (props["list"] as Array<number>).map((i) => {
                        return (<ul>{i.toString()}</ul>)
                    })
                }
            </ul>
    </div>
}
const app = document.getElementById('app')

const renderButton = document.createElement('button')
renderButton.textContent = 'Render'
let cnt = 0
renderButton.addEventListener('click', () => {
    const vDom: VDomNode = App({
        "example": (new Date()).toString(),
        "show": cnt % 2 === 0,
        "list": Array.from({ length: 10 - cnt * 2 }, (_, i) => i)
    }, []) as unknown as VDomNode
    cnt++
    console.log(vDom)
    render(vDom, app!)
})
document.body.appendChild(renderButton)