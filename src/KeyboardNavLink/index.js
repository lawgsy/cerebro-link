import React, { PropTypes } from 'react'
import { KeyboardNav, KeyboardNavItem } from 'cerebro-ui'

const KeyboardNavLink = ({ links, link, hide, writeLinksToFile }) => (
  <div>
    <KeyboardNav>
      <ul>
        <KeyboardNavItem key={'remove-'+link} onSelect={() => {
          delete links[link]
          writeLinksToFile()
          hide(link)
        }}>
          Remove
        </KeyboardNavItem>
      </ul>
    </KeyboardNav>
  </div>
)

KeyboardNavLink.propTypes = {
  links: PropTypes.object,
  link: PropTypes.string,
  hide: PropTypes.func,
  writeLinksToFile: PropTypes.func
}

export default KeyboardNavLink
