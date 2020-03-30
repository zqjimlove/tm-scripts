// ==UserScript==
// @name        YAPI 2 Typescript DTS
// @namespace   YAPI 2 Typescript DTS
// @match       *://yapi.golcer.cn/*
// @grant       none
// @version     1.0.0
// @author      inwoo
// @require     https://cdn.staticfile.org/axios/0.19.2/axios.min.js
// @require     https://cdn.staticfile.org/jquery/3.1.1/jquery.min.js
// @description 2020/3/30 上午9:58:14
// @updateURL   https://cdn.rawgit.com/zqjimlove/tm-scripts/master/dist/yapi2ts.js
// @icon        https://api.iconify.design/fa-solid:cat.svg?color=%23ff502c
// ==/UserScript==

import { AxiosStatic } from '../node_modules/axios/index'

declare const axios: AxiosStatic
declare const $: JQueryStatic
;((): void => {
  function tsGen(typeName, reqProperties, resProperties): string {
    function _propertiesGen(
      typeName: string,
      properties: any,
      isExport = false
    ): string {
      const rootResult = {}
      const comments = {}
      let result = ''
      for (const key in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, key)) {
          const element = properties[key]
          const {
            type,
            description,
            items: { type: itemsType, properties: itemsProperties } = {
              type: '',
              properties: []
            }
          } = element

          comments[key] = description

          switch (type) {
            case 'string':
            case 'number':
            case 'boolean':
              rootResult[key] = type
              break
            case 'integer':
              rootResult[key] = 'number'
              break
            case 'array':
              if (itemsType === 'object') {
                let itemKey = key + 'Item'
                itemKey = itemKey[0].toLocaleUpperCase() + itemKey.substring(1)
                rootResult[key] = `Array<${itemKey}>`
                result += _propertiesGen(itemKey, itemsProperties)
              } else {
                rootResult[key] = 'Array<any>'
              }

              break
            case 'object':
              result[key] = 'any'
              break
          }
        }
      }

      function injectComments(code): string {
        code = code.replace(/(.*)\n/g, function(line) {
          const reg = /(\s*)(\w*):(\w*)/gi
          const matcher = reg.exec(line)
          if (matcher) {
            const [_, space, key] = matcher
            if (comments[key]) {
              const comment = space + `/** ${comments[key]} */ \n\n`
              return comment + line
            }
          }
          return line
        })
        return code
      }

      result +=
        `${isExport ? 'export ' : ''}type ${typeName} = ` +
        injectComments(
          JSON.stringify(rootResult, void 0, 2).replace(/"/gi, '')
        ) +
        ';\n\n'
      return result
    }

    function format(code): string {
      return code.replace(/,/gi, ';').replace(/(.*)\n/gi, '  $1\n')
    }

    // return `export namespace ${typeName}Model {\n${_propertiesGen('RequestData', reqProperties, true)}${_propertiesGen('ResponseData', resProperties, true)}\n}`
    return (
      `export namespace ${typeName}Model {\n\n` +
      format(_propertiesGen('RequestData', reqProperties, true)) +
      format(_propertiesGen('ResponseData', resProperties, true)) +
      '}'
    )
  }

  function fetchInterfaceData(language = ''): void {
    if (!language) {
      console.error(`未设置language`)
      return
    }
    const URL_REGEX = /project\/(\d+)\/interface\/api\/(\d+)/gi
    const macher = URL_REGEX.exec(window.location.href)
    const urlOrigin = window.location.origin

    if (!macher) {
      alert('请在接口详情页中使用')
      return
    }
    const [_, projectId, intrefaceId] = macher
    const namespamce = window.prompt('请输入改模型的名称')
    axios
      .get(`${urlOrigin}/api/interface/get`, {
        params: {
          id: intrefaceId
        }
      })
      .then(({ data: _data }) => {
        if (_data.errcode === 0) {
          const {
            data: { req_body_other: reqBodyStr, res_body: resBodyStr }
          } = _data

          const reqBody = JSON.parse(reqBodyStr)
          const resBody = JSON.parse(resBodyStr)

          const { properties: reqProperties, required: reqRequired } = reqBody
          const { properties: resProperties, required: resRequired } = resBody

          const resPropertiesData = resProperties.data.properties
          const code = tsGen(namespamce, reqProperties, resPropertiesData)
          const el = $('#yapi2tsTA').html(code)[0] as HTMLInputElement
          el.select()
          el.setSelectionRange(0, code.length)
          document.execCommand('copy')
          alert('生成成功，已复制到粘贴版')
        }
      })
  }

  function createIconItem(item): string {
    return `<a class="icon" style="background-image:url(${item.icon})" data-language="${item.key}"></a>`
  }

  function createUI(): void {
    $('head').append(`
      <style>
        .languages_type_icons {
          line-height: 0;
          font-size: 0;
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 100;
        }
        .languages_type_icons .icon{
          display: inline-block;
          width: 26px;
          height: 26px;
          margin-right: 6px;
          background-size: contain;
        }
      </style>
    `)
    const languages = [
      {
        key: 'ts',
        icon: 'https://api.iconify.design/logos-typescript-icon.svg'
      }
    ]

    const reqTitleCopyItemsEl = document.createElement('div')
    reqTitleCopyItemsEl.className = 'languages_type_icons'
    reqTitleCopyItemsEl.innerHTML = languages
      .map(item => {
        return createIconItem(item)
      })
      .join('')

    $(reqTitleCopyItemsEl).on('click', '.icon', function(e) {
      fetchInterfaceData(e.currentTarget.dataset?.language)
    })

    $(reqTitleCopyItemsEl).append(
      `<textarea style="width:1px;height:1px;border:0px;margin:0px;padding:0px;opacity:0" id="yapi2tsTA"></textarea>`
    )

    $('body').append(reqTitleCopyItemsEl)
    console.log('yapi2ts inited')
  }

  createUI()
})()
