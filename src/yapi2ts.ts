// ==UserScript==
// @name        YAPI 2 Typescript DTS
// @namespace   YAPI 2 Typescript DTS
// @match       *://yapi.golcer.cn/*
// @grant       none
// @version     1.0.1
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
  function formatSafeName(typeName: string): string {
    typeName = typeName.replace(/[^A-Za-z0-9]/gi, '$')
    if (/\d/.test(typeName[0])) {
      typeName = '$' + typeName
    }
    return typeName
  }

  function formatSafeKey(typeName: string): string {
    if (/[\W]/.test(typeName)) {
      return `"${typeName}"`
    }
    return typeName
  }

  function isBaseType(type): boolean {
    return ['string', 'number', 'boolean', 'integer'].includes(type)
  }

  function formatBaseType(type): string {
    return type === 'integer' ? 'number' : type
  }

  function prettyCode(code: string): string {
    const codes = code.split('\n')
    let spaces = ''
    return codes
      .map(line => {
        if (!line) {
          return line
        }
        if (~line.indexOf('}')) {
          spaces = spaces.substring(2)
        }
        const result = spaces + line
        if (~line.indexOf('{')) {
          spaces += '  '
        }
        return result
      })
      .join('\n')
  }

  function tsGen(modelName, reqProperties, resProperties): string {
    const NSScopeStack = []

    const rootPropertiesStack: {
      typeName: string
      properties: any
      option?: {
        assignment?: string
        isObjectPropertie?: boolean
        isExport?: boolean
      }
    }[] = [
      {
        typeName: 'RequestData',
        properties: reqProperties,
        option: {
          isExport: true
        }
      },
      {
        typeName: 'ResponseData',
        properties: resProperties,
        option: {
          isExport: true
        }
      }
    ]

    function _propertiesGen(
      scopeStack: string[],
      typeName: string,
      properties: any,
      option: {
        assignment?: string
        isObjectPropertie?: boolean
        isExport?: boolean
      } = {}
    ): void {
      // typeName = formatTypeName(typeName)
      const { assignment = ' =', isObjectPropertie = false, isExport = false } = option
      const { type, properties: childProperties, description } = properties
      let {
        items: {
          type: itemsType,
          properties: itemsProperties,
          items: itemsChildItems
        } = {
          type: '',
          properties: [],
          items: []
        }
      } = properties

      const objectStack = []
      const arrayItemName = formatSafeName(typeName + 'Item')

      if (isObjectPropertie) {
        typeName = formatSafeKey(typeName)
      }

      let result = ''
      if (description) {
        result += `/** ${description} */\n\n`
      }

      function _itemsGen(arrayDep = 1): string {
        if (itemsType === 'object' /* || itemsType === 'array' */) {
          /* _propertiesGen(NSScopeStack, arrayItemName, {
            type: 'object',
            properties: itemsProperties
          }) */
          rootPropertiesStack.push({
            typeName: arrayItemName,
            properties: {
              type: 'object',
              properties: itemsProperties
            }
          })
          return (
            `${arrayItemName}` +
            Array(arrayDep)
              .fill('[]')
              .join('')
          )
        } else if (isBaseType(itemsType)) {
          /* result += `${typeName}${assignment} ${formatBaseType(itemsType)}` */
          return (
            formatBaseType(itemsType) +
            Array(arrayDep)
              .fill('[]')
              .join('')
          )
        } else if (itemsType === 'array') {
          itemsType = itemsChildItems.type
          itemsProperties = itemsChildItems.properties
          itemsChildItems = itemsChildItems.items
          return _itemsGen(arrayDep + 1)
        }
      }

      switch (true) {
        case type === 'array':
          result += `${typeName}${assignment} ${_itemsGen()};`
          break
        case type === 'object':
          for (const key in childProperties) {
            _propertiesGen(objectStack, key, childProperties[key], {
              assignment: ':',
              isObjectPropertie: true
            })
          }
          result += `${formatSafeName(typeName)}${assignment} {\n`
          result += objectStack.join('\n')
          result += `\n};`
          break
        case isBaseType(type):
          result += `${typeName}${assignment} ${formatBaseType(type)};`
          break
        default:
          result += `${typeName}${assignment} any;`
      }

      scopeStack.push(
        `${isExport ? 'declare ' : ''}` + (isObjectPropertie ? '' : 'type ') + result
      )
    }

    /*  _propertiesGen(NSScopeStack, 'RequestData', reqProperties, {
      isExport: true
    })
    _propertiesGen(NSScopeStack, 'ResponseData', resProperties, {
      isExport: true
    }) */
    // return `export namespace ${typeName}Model {\n${_propertiesGen('RequestData', reqProperties, true)}${_propertiesGen('ResponseData', resProperties, true)}\n}`

    let task
    while ((task = rootPropertiesStack.pop())) {
      const { typeName, properties, option } = task
      _propertiesGen(NSScopeStack, typeName, properties, option)
    }

    return prettyCode(
      `export namespace ${modelName}Model {\n` +
        NSScopeStack.map(val => `${val}`).join('\n\n') +
        '\n}\n'
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

          const reqBody = JSON.parse(reqBodyStr || '{}')
          const resBody = JSON.parse(resBodyStr || '{}')

          // const { properties: reqProperties, required: reqRequired } = reqBody
          const { properties: resProperties, required: resRequired } = resBody
          console.log(resBody)
          const resBodyData = resProperties.data
          const code = tsGen(namespamce, reqBody, resBodyData)
          const el = $('#yapi2tsTA').html(code)[0] as HTMLInputElement
          el.select()
          el.setSelectionRange(0, code.length)
          document.execCommand('copy')
          // alert('生成成功，已复制到粘贴版')
          console.log(code)
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
