(function(){

  'use strict';

  const editor = document.getElementById('js-editor');
  const bold = document.getElementById('js-bold');
  const underline = document.getElementById('js-underline');

  function unwrap(element) {
    element.replaceWith(...element.childNodes);
  }

  function splitTextNode(range) {
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      let newNode = range.startContainer.splitText(range.startOffset);

      range.setStartBefore(newNode);
    }

    if (range.endContainer.nodeType === Node.TEXT_NODE) {
      let newNode = range.endContainer.splitText(range.endOffset);

      range.setEndBefore(newNode);
    }
  }

  function isInRange(sourceRange, targetRange) {
    return (
      sourceRange.compareBoundaryPoints(Range.START_TO_START, targetRange) <= 0 &&
      sourceRange.compareBoundaryPoints(Range.END_TO_END, targetRange) >= 0
    );
  }

  function isOutRange(sourceRange, targetRange) {
    return (
      sourceRange.compareBoundaryPoints(Range.START_TO_END, targetRange) <= 0 &&
      sourceRange.compareBoundaryPoints(Range.END_TO_START, targetRange) >= 0
    );
  }

  function isDecorated(node, selector) {
    if (node === null) {
      return false;
    }

    const element = (node.nodeType === Node.TEXT_NODE) ? node.parentElement : node;

    return element !== null && element.closest(selector) !== null;
  }

  function getTextNodeInRange(range) {
    const treeWalker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const nodeRange = new Range();

          nodeRange.selectNode(node);

          if (isInRange(range, nodeRange)) {
            return NodeFilter.FILTER_ACCEPT
          }
        }
      }
    );

    const elements = [];

    while (true) {
      const node = treeWalker.nextNode();

      if (node === null) {
        break;
      }

      elements.push(node);
    }

    return elements;
  }

  function decorateText(selection, selector) {
    if (selection === null) {
      return;
    }

    if (selection.rangeCount > 0) {
      let range = selection.getRangeAt(0);

      if (range.collapsed) {
        return;
      }

      const texts = getTextNodeInRange(range);

      for (let i = 0, len = texts.length; i < len; i += 1) {
        const node = texts[i];

        if (isDecorated(node, selector)) {
          continue;
        }

        const element = document.createElement(selector);

        element.prepend(node.cloneNode());

        node.replaceWith(element);
      }

      selection.removeAllRanges();
    }
  }

  function undecorateText(selection, selector) {
    if (selection === null) {
      return;
    }

    if (selection.rangeCount > 0) {
      let range = selection.getRangeAt(0);

      if (range.collapsed) {
        return;
      }

      console.log('range', range);

      console.log('commonAncestorContainer', range.commonAncestorContainer);
      console.log('start', range.startContainer, range.startOffset);
      console.log('end', range.endContainer, range.endOffset);

      splitTextNode(range);

      // const textNodes = getTextNodeInRange(range).map(function(textNode) {

      const p = new Range();

      p.selectNode(range.commonAncestorContainer);

      const textNodes = getTextNodeInRange(p).map(function(textNode) {
        const decorateRange = new Range();
        const decorateElement = textNode.parentElement.closest(selector)

        if (decorateElement !== null) {
          decorateRange.selectNode(decorateElement);
        }

        return {
          textNode,
          decorateElement: decorateElement || null,
          decorateRange: decorateElement !== null ? range : null
        }
      })

      for (let i = 0, len = textNodes.length; i < len; i += 1) {
        const {
          textNode,
          decorateElement,
          decorateRange,
        } = textNodes[i];

        if (decorateElement === null) {
          continue;
        }

        console.log(textNode);
        console.log(decorateElement);
        console.log(decorateRange);

        const r = new Range();

        r.selectNodeContents(textNode);

        console.log(r);
        console.log(isInRange(decorateRange, r));
        console.log(isOutRange(range, r));

        if (!isInRange(decorateRange, r)) {
          const element = document.createElement(selector);

          element.prepend(textNode.cloneNode());

          textNode.replaceWith(element);
        }
      }

      for (let i = 0, len = textNodes.length; i < len; i += 1) {
        const {
          textNode,
          decorateElement,
          decorateRange,
        } = textNodes[i];

        if (decorateElement === null) {
          continue;
        }

        decorateElement.replaceWith(...decorateElement.childNodes);
      }
    }

    selection.removeAllRanges();
  }

  if (editor && bold && underline) {
    editor.innerHTML =
      '<p>いろは にほへと' +
      '<b>ちり ぬる</b>' + 
      'を わかよ たれそ' +
      '<u>つね ならむ</u>' +
      'ういの おくやま' +
      '<b>けふ<u>こえて</u>あさき ゆめみし</b>' +
      'えひも <span>せす <b>ab cd ef</b>gh</span>ij' +
      'kl mn <u>op qr st</u> uv wx yz</p>';

    document.addEventListener('selectionchange', function(event) {
      console.log('selectionchange', window.getSelection());
    }, false);

    bold.addEventListener('click', function() {
      const selection = window.getSelection();

      if (selection === null) {
        return;
      }

      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        if (range.collapsed) {
          return;
        }

        splitTextNode(range);

        const texts = getTextNodeInRange(range);

        const isDeco = texts.some(function(text) {
          return isDecorated(text, 'b');
        });

        if (isDeco) {
          undecorateText(selection, 'b');
        } else {
          decorateText(selection, 'b');
        }
      }
    }, false);

    underline.addEventListener('click', function() {
      const selection = window.getSelection();

      if (selection === null) {
        return;
      }

      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        if (range.collapsed) {
          return;
        }

        splitTextNode(range);

        const texts = getTextNodeInRange(range);

        const isDeco = texts.some(function(text) {
          return isDecorated(text, 'u');
        });

        if (isDeco) {
          undecorateText(selection, 'u');
        } else {
          decorateText(selection, 'u');
        }
      }
    }, false);

    editor.addEventListener('input', function(event) {
      console.log('input', event);
    }, false);
  }

}());
