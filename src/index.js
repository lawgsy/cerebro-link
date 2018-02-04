// var favicon = require('favicon');
import fetchFavicon from 'favicon-getter'
import * as fs from 'fs-extra'
import { remote } from 'electron'
import path from 'path'

// import Preview from './Preview'

import { SmartIcon, KeyboardNav, KeyboardNavItem } from 'cerebro-ui'

// import React, { PropTypes } from 'react'
import FileDetails from './FileDetails'
import KeyboardNavLink from './KeyboardNavLink'
import styles from './styles.css'

let links = {}

const thumbAPI = 'ab45a17344aa033247137cf2d457fc39ee4e7e16a464'
const thumbURL = `https://thumbnail.ws/get/thumbnail/?apikey=${thumbAPI}`


const userDataPath = remote.app.getPath('userData')
const linksFilePath = path.join(userDataPath, '/link_db.json')
const writeLinksToFile = () => {
  // console.log("writing!", linksFilePath)
  fs.outputJson(linksFilePath, links)
}

const initialize = () => {
  // read links object if available, otherwise write default to file
  fs.readJson(linksFilePath)
    .then(readLinks => {
      links = readLinks
      // console.log("loaded",links)
    }).catch(err => {
      links = {
        'google': {
          url: 'http://www.google.com',
          icon: 'http://www.google.com/images/branding/product/ico/googleg_lodp.ico'
        },
        'yahoo': {
          url: 'http://www.yahoo.com',
          icon: 'http://www.yahoo.com/favicon.ico'
        }
      }
      writeLinksToFile()
    })
}

const addTemplate = (
  <div>
    Example usage:<br />
    <pre>#add google google.com</pre>
  </div>
)

const generateLinkDisplay = (link, url, icon, hide, open) => {
  // TODO: display file information rather than website preview if URL
  //
  // if(!fs.pathExistsSync(url)) { // not a local path
  //   display(generateLinkDisplay(link, url, icon, hide, actions.open))
  //   console.log("NOT LOCAL", url)
  // } else {
  //   console.log("LOCAL", url)
  //   display(generateLinkDisplayLocal(link, url, icon, hide, actions.open))
  // }
  console.log(link, icon)
  return {
    title: "#"+link,
    id: link,
    icon,
    subtitle: url,
    getPreview: () => {
      return (
        <div>
          <div className={styles.previewHeader}>
            {
              icon &&
              <div className={styles.previewIcon}>
                <SmartIcon path={icon} />
              </div>
            }
            <div className={styles.previewName}>{link}</div>
          </div>
          { fs.pathExistsSync(url) ?
              <FileDetails path={url} key={url} skipName /> :
              <img src={`${thumbURL}&url=${url}&width=400&mobile=false`} /> }
          <KeyboardNavLink
            links={links}
            link={link}
            hide={hide}
            writeLinksToFile={writeLinksToFile} />
        </div>
      )
    },
    onSelect: e => {
      open(url)
    }
  }
}

const fn = ({ term, display, actions, hide }) => {
  const matches = term.match(/^#(.*)/i)

  if(matches) {
    let matching_links = Object.keys(links)
    let query = term.slice(1)
    let queryRegEx = new RegExp(query, "i")

    const menuOptions = ["add", "remove", "list"]

    // if there is input, filter by it
    if (query.length > 0) {
      let matchingMenu = menuOptions.filter(l => l.match(queryRegEx))
      // console.log(matchingMenu)
      // TODO: rename variable matching_links to matchingLinks
      // TODO:
      // 1) match menu options
      //       - if none, filter link list by input
      //       - else, show only menu options that match
      matching_links = matching_links.filter(l => l.match(queryRegEx))

      // if (matching_links.length==0) matching_links = Object.keys(links)
    }

    // TODO: display default results (add)
    const split_query = query.trim().split(' ')


    let newLink = split_query[1]
    let newURL = split_query[2]
    if (split_query[0]=="add" && newLink) {
      display({
        title: '#add '+newLink,
        icon: 'fa-link',
        onSelect: async e => {
          if(split_query.length == 3) {

            let favicon;
            // TODO: check newURL for correctness before adding?
            // or just stick with prepending http if necessary...
            // if (newURL.indexOf('http://') == -1) newURL = 'http://'+newURL
            if(!fs.pathExistsSync(newURL)) { // not a local path
              if (!/^(https?:)?\/\//i.test(newURL)) {
                // seems to be a URL, append http if necessary
                newURL = 'http://' + newURL
              }
              favicon = await fetchFavicon(newURL)
              // if(favicon===undefined)
            } else {

              //UNCOMMENT: //const favicon = await fetchFavicon(newURL)
              favicon = newURL
            }
            links[newLink] = { url: newURL, icon: favicon }
            writeLinksToFile()
            display(generateLinkDisplay(newLink, newURL, favicon, hide, actions.open))
            // e.preventDefault() -- ?


            // fetchFavicon(newURL).then(favicon => {
            //   e.preventDefault()
            //   links[newLink] = { url: newURL, icon: favicon }

            //   writeLinksToFile()
            //   display(generateLinkDisplay(newLink, newURL, favicon))
            // }).catch(e => {
            //   console.error(e)
            // })
          } else {
            e.preventDefault()
            actions.replaceTerm(term)
          }
        },
        getPreview: () => addTemplate
      })
    } else {
      // let tempRegExpTester = new RegExp(split_query[0],"i")
      let notMenuOption = (menuOptions.indexOf(split_query[0]) == -1)
      let noMatchingLinks = (matching_links.length == 0 && notMenuOption)

      if (noMatchingLinks) {
        display({ title: 'No matching links' })
      }

      if(split_query[0].length == 0 || noMatchingLinks) {
        // nothing entered after #

        // || matching_links.length == 0

        display({
          title: '#add',
          icon: 'fa-link',
          onSelect: e => {
            e.preventDefault()
            actions.replaceTerm('#add ')
          },
          getPreview: () => addTemplate
        })
        display({
          title: '#list',
          icon: 'fa-link',
          onSelect: e => {
            e.preventDefault()
            actions.replaceTerm('#list')
          }
        })
        // if (split_query[0]=="list") {
        //   matching_links = Object.keys(links)
        // }
        // if (matching_links.length != 0)
        //   return true
      } else {//if(split_query[0].length != 0) {
        if (split_query[0]=="list") {
          matching_links = Object.keys(links)
        }
      }
    }

    for (let link of matching_links) {
      const {icon, url} = links[link]
      display(generateLinkDisplay(link, url, icon, hide, actions.open))
    }
  }
}

export {
  fn,
  initialize
}
