let fs = require('fs')
let exists = fs.existsSync
let read = fs.readFileSync
let md = require('marked')
let fm = require('front-matter')
let join = require('path').join
let Layout = require('../layout')
let SocialLayout = require('../layout/social')

function MarkdownTemplate({title, body}) {
  /* begin hack for injecting variable content into markdown files */
  body = body.replace(/\$\{CAREER_NIGHT_URL\}/g, process.env.CAREER_NIGHT_URL)
  body = body.replace(/\$\{SLACK_JOIN_URL\}/g, process.env.SLACK_JOIN_URL)
  /* end hack */
  return /*html*/`
    <div id="page">
      <div class="page-title">
        <div><h1>${title}</h1></div>
      </div>
      <div class="page-body">
        ${md(body)}
      </div>
    </div>`
}

/**
 * Page view: catchall for all other pages, authored either in markdown or HTML
 */
module.exports = async function Page (req) {
  let page = req.path.substr(1)
  let type = 'markdown'
  let { social } = req.queryStringParameters
  let doc = join(__dirname, 'content', `${page}.md`)
  if (!exists(doc)) {
    doc = join(__dirname, 'content', `${page}.html`)
    type = 'html'
  }

  if (!exists(doc))
    return // Bails to 404

  // Read the file
  doc = read(doc).toString()

  // pull out any front-matter key/values
  let { attributes, body } = fm(doc)
  let title = attributes.title
  let html

  if (social !== undefined) {
    let excerpt = attributes.excerpt
    let image = attributes.image
    let header = title
    html = SocialLayout({ image, header, excerpt })
  }
  else {
    let content
    if (type === 'markdown') {
      content = MarkdownTemplate({ title, body })
    }
    else {
      content = body
    }

    let socialUrl = `https://${ process.env.NODE_ENV === 'staging' ? 'staging.' : '' }2020.cascadiajs.com/images/social/${ page }-share.png`
    html = Layout({ title, content, socialUrl })
  }

  return {
    html
  }
}
