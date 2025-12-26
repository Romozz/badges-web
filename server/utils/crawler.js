function isCrawler(userAgent) {
    if (!userAgent) return false;
    const crawlers = [
        'TelegramBot',
        'facebookexternalhit',
        'Twitterbot',
        'Discordbot',
        'Slackbot',
        'WhatsApp',
        'LinkedInBot',
        'Googlebot'
    ];
    return crawlers.some(crawler => userAgent.includes(crawler));
}

function generateHTMLWithMeta(metaTags) {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${metaTags}
</head>
<body>
    <div id="root"></div>
</body>
</html>`;
}

module.exports = {
    isCrawler,
    generateHTMLWithMeta
};
