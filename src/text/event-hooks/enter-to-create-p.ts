/**
 * @description 回车时，保证生成的是 <p> 标签
 * @author wangfupeng
 */

import Editor from '../../editor/index'
import $, { DomElement } from '../../utils/dom-core'
import { UA } from '../../utils/util'

/**
 * 回车时，保证生成的是 <p> 标签
 * @param editor 编辑器实例
 * @param enterUpEvents enter 键 up 时的 hooks
 * @param enterDownEvents enter 键 down 时的 hooks
 */
function enterToCreateP(editor: Editor, enterUpEvents: Function[], enterDownEvents: Function[]) {
    function insertEmptyP($selectionElem: DomElement) {
        const $p = $('<p><br></p>')
        $p.insertBefore($selectionElem)
        editor.selection.createRangeByElem($p, true)
        editor.selection.restoreSelection()
        $selectionElem.remove()
    }

    // enter up 时
    function fn() {
        const $textElem = editor.$textElem
        const $selectionElem = editor.selection.getSelectionContainerElem() as DomElement
        const $topSelectElem = editor.selection.getSelectionRangeTopNodes(editor)[0]
        const $parentElem = $selectionElem.parent()

        // 兼容firefox
        if (UA.isFirefox) {
            if (
                $topSelectElem.getNodeName() === 'BLOCKQUOTE' &&
                $selectionElem.getNodeName() === 'BLOCKQUOTE'
            ) {
                const $last = $selectionElem.childNodes()?.last()
                if ($last?.getNodeName() === 'BR') {
                    const $newLine = $('<p><br></p>')
                    $last.remove()
                    $selectionElem.append($newLine)
                    editor.selection.moveCursor($newLine.getNode(), true)
                }
            }
        }

        if ($parentElem.html() === '<code><br></code>') {
            // 回车之前光标所在一个 <p><code>.....</code></p> ，忽然回车生成一个空的 <p><code><br></code></p>
            // 而且继续回车跳不出去，因此只能特殊处理
            insertEmptyP($selectionElem)
            return
        }

        if (!$parentElem.equal($textElem)) {
            // 不是顶级标签
            return
        }

        const nodeName = $selectionElem.getNodeName()
        if (nodeName === 'P') {
            // 当前的标签是 P ，不用做处理
            return
        }

        if ($selectionElem.text()) {
            // 有内容，不做处理
            return
        }

        // 插入 <p> ，并将选取定位到 <p>，删除当前标签
        insertEmptyP($selectionElem)
    }
    enterUpEvents.push(fn)

    // enter down 时
    function createPWhenEnterText(e: Event) {
        // selection中的range缓存还有问题,更新不及时,此处手动更新range,处理enter的bug
        editor.selection.saveRange(getSelection()?.getRangeAt(0))
        const $selectElem = editor.selection.getSelectionContainerElem() as DomElement
        const $topSelectElem = editor.selection.getSelectionRangeTopNodes(editor)[0]
        if ($selectElem.id === editor.textElemId) {
            // 回车时，默认创建了 text 标签（没有 p 标签包裹），父元素直接就是 $textElem
            // 例如，光标放在 table 最后侧，回车时，默认就是这个情况
            e.preventDefault()
            editor.cmd.do('insertHTML', '<p><br></p>')
        }
        // 特殊处理quote
        //最后一行为<p><br></p>时再按会出跳出blockquote
        // 可以考虑直接移动选区来兼容firefox
        if ($topSelectElem.getNodeName() === 'BLOCKQUOTE') {
            console.log($selectElem.text())
            if ($selectElem.text() === '') {
                e.preventDefault()
                $selectElem.remove()
                const $newLine = $('<p><br></p>')
                $newLine.insertAfter($topSelectElem)
                editor.selection.moveCursor($newLine.getNode())
            }
        }
    }
    enterDownEvents.push(createPWhenEnterText)
}

export default enterToCreateP
