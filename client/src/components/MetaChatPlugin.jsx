"use client";

import Script from 'next/script';

export default function MetaChatPlugin({ pageId = "2725998090803875" }) {
  return (
    <>
      <div id="fb-root"></div>
      <div id="fb-customer-chat" className="fb-customerchat"></div>
      <Script id="meta-messenger-chat-sdk" strategy="afterInteractive">
        {`
          var chatbox = document.getElementById('fb-customer-chat');
          if (chatbox) {
            chatbox.setAttribute("page_id", "${pageId}");
            chatbox.setAttribute("attribution", "biz_inbox");
          }
          window.fbAsyncInit = function() {
            if (window.FB) {
              window.FB.init({
                xfbml: true,
                version: 'v18.0'
              });
            }
          };
          (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = 'https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js';
            fjs.parentNode.insertBefore(js, fjs);
          }(document, 'script', 'facebook-jssdk'));
        `}
      </Script>
    </>
  );
}
