import { Html, Head, Main, NextScript } from 'next/document'
import Script from 'next/script'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <Script src="/view/v2/es2020_es2021_es2022.polyfill.min.js" strategy='beforeInteractive' />
        <Script src="/view/v2/jquery-1.8.3.min.js" strategy='beforeInteractive' />
        <Script src="/view/v2/jquery-ui.min.js" strategy='beforeInteractive' />
        {/* <Script src="/view/v2/wmks.min.js" strategy='beforeInteractive' /> */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
