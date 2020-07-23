
function configEvent(event, proxy) {
  var e = {}
  for (var attr in event) e[attr] = event[attr]
  e.target = e.currentTarget = proxy
  return e
}

/**
 * @param options
 *   open: ([method, url], xhr) => {}
 *   send: ([body], xhr) => {}
 *   onreadystatechange: (xhr) => {}
 */
var xhrProxy = function(options) {

  // 始终保持原 XHR 的存在
  window.originalXHR = window.originalXHR || XMLHttpRequest

  // 覆盖全局的 XHR
  XMLHttpRequest = function() {
    var xhr = new window.originalXHR
    // 对每个属性做代理
    for (var attrName in xhr) {
      try {
        var attrType = typeof xhr[attrName]
        // 对函数进行前插桩
        if (attrType === 'function') {
          this[attrName] = proxyFunc(attrName)
        } else {
          Object.defineProperty(this, attrName, {
            get: proxyGet(attrName),
            set: proxySet(attrName)
          })
        }
      } catch(e) {}
    }

    var that = this
    xhr.getProxy = function() {
      return that
    }

    this.xhr = xhr

  }

  function proxyFunc(func) {
    return function() {
      var args = [].slice.apply(arguments)
      if (options[func]) {
        options[func].call(this, args, this.xhr)
      }
      this.xhr[func].apply(this.xhr, args)
    }
  }

  function proxyGet(attr) {
    return function() {
      return this.xhr[attr]
    }
  }

  function proxySet(attr) {
    return function(val) {
      var xhr = this.xhr
      var that = this
      // on 开头的回调函数
      if (attr.indexOf('on') === 0 && options[attr]) {
        xhr[attr] = function(e) {
          e = configEvent(e, that)
          options[attr].call(that, xhr, e)
          val.call(that, e)
        }
      }
    }
  }

  return window.originalXHR
  
}


// TEST
xhrProxy({
  open: function([method, url], xhr) {
    console.log(`${method} ${url}`)
  },
  send: function([body], xhr) {
    console.log(`data: ${body}`)
  },
  onreadystatechange: function(xhr) {
    if (xhr.readyState === 4) {
      console.log(xhr.responseText)
    }
  }
})

 var test = new XMLHttpRequest
 test.open('GET', 'https://www.baidu.com')
 test.onreadystatechange = function() {
   if (test.readyState == 4 && test.status >= 200 && test.status < 300) {
     console.log('req success')
   }
 }
 test.send(null)
