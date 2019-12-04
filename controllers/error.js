exports.get404 = (req, res, next) => {
    //res.status(404).send('<h1>Page not found</h1>');
    //res.status(404).sendFile(path.join(__dirname, 'views', 'page-not-found.html'));
    res.status(404).render('404', {
        pageTitle: 'Page Not Founds', 
        path: '/404',
        isAuthenticated: req.session.isLoggedIn
    });
};

exports.get500 = (req, res, next) => {
    res.status(500).render('500', {
        pageTitle: 'Errors !', 
        path: '/500',
        isAuthenticated: req.session.isLoggedIn
    });
};