module.exports = {
	dburl : "mongodb://daiAdmin:0126*dai*@127.0.0.1:27017/daimont",
	secret : "$daimont.2017",
	appPort : 2020,
	ssl_phrase : process.env.SSL_PHRASE,
	bucket_name : 'daimontstorage',
	email_recipient : process.env.ADMIN_EMAIL,
	base_url_dev : 'http://www.daimont.com/frontend/dist/#/',
	base_url_pro : 'http://www.daimont.com/frontend/dist/#/',
	smtp_email : "listerine1989@gmail.com",
	smtp_password : 'house1989*',
	smtp_server : 'smtp.gmail.com' 
}