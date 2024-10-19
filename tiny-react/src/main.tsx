import { mount, useState, type FuncComponent } from "./runtime";
import { createElement, fragment, VDomAttributes, VDomNode } from "./v-dom";

const App: FuncComponent = (_: VDomAttributes, __: VDomNode[]) => {
    const [cnt, setCnt] = useState(0)
    return <>
        <button onClick={() => {
            setCnt(cnt() + 1)
        }}>Click me</button>
        <p>Count: {cnt()}</p>
    </>
}
const app = document.getElementById('app')
mount(App, {}, [], app!)