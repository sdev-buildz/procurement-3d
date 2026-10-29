import { sharedConfig } from '@packages/web-app-utils/shared'

/**
 * The children of the head tag such as Script tags, Link tags, etc...
 */
export const HtmlHeadChildren = () => {
  return (
    <>
      <meta charSet='utf-8' />
      <link rel='icon' href={`${sharedConfig.origin}/static/favicon.ico`} />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      <meta
        name='description'
        content='Demo website showcasing the apollo client state synchronization. Used in e2e tests.'
      />
      <title>
        Emterprise Procurement Workspace and 3D Configuration Workspace
      </title>

      {/* Favicon */}
      <link rel='icon' type='image/svg' href='./static/assets/image.png' />
      <link
        href='https://fonts.googleapis.com/css?family=Roboto'
        rel='stylesheet'
        type='text/css'
      />
      <script src='https://apis.google.com/js/api:client.js'></script>
    </>
  )
}
