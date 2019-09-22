


var functions = {
    getUTCTime: function () {
        return new Date(new Date().toUTCString());
    },
    getUniqueID: function () {
        return uuid();
    },
    getCookieConf : function(){
        // return { maxAge: 600000, httpOnly: true }
        return { maxAge: 600000 }
    },
    privateKeyHandler: function (req, res, next) {
        if (req.headers['authorization'])
        {
            var privateKey = req.headers['authorization'].split(" ")[1];

            jwt.verify(privateKey, config.env.JWT_KEY, (err, decode) => {
                if (err)
                    return res.status(500).json({error: "Not authorised"});
                next()
            })
        } else
        {
            return res.status(500).json({error: "Not authorised"});
        }
    },
    responseHandler: function (res, status, jsonData) {
        res.header("Access-Control-Allow-Origin", "*");
        res.setHeader('Content-Type', 'application/json');
        res.header("Access-Control-Allow-Headers", "Authorization, Origin,X-Requested-With, Content-Type, Accept");
        res.header('Access-Control-Allow-Methods', 'PUT,GET,PATCH,POST');

        res.status(status).json(jsonData);
        // res.send();
    },
    hashPassword: function (pass, cb) {
        bcrypt.hash(pass, salt, (err, hash) => {
            if (err)
                return cb(err);

            cb(null, hash)

        })
    },
    comparePassword: function (candidatePass, originalPass, cb) {
        bcrypt.compare(candidatePass, originalPass, function (err, isMatch) {
            if (err)
                return cb(err);
            cb(null, isMatch);
        })
    },
    jwtSign: function (candidatemail) {
        return jwt.sign(candidatemail, config.env.JWT_KEY);
    },
    jwtVerify: function (token, cb) {
        jwt.verify(token, config.env.JWT_KEY, (err, decode) => {
            if (err)
                cb(err)
            cb(null,decode);
        })
    },
    setRedis: function (key, value) {
        client.on("error", function (err) {
            return cb(err);
        });

        client.set(key, value, redis.print);

    },
    getRedis: function (key, cb) {
        client.on("error", function (err) {
            return cb(err);
        });

        client.get(key, (err, doc) => {
            if (err)
                cb(err);
            cb(null, doc);
        });

    },
    sendMsgMail: function (email, msg, cb) {
        // Give SES the details and let it construct the message for you.
        client.sendEmail({
            to: email
            , from: config.env.Verified_mail
            , cc: config.env.Verified_mail
            , bcc: [config.env.Verified_mail]
            , subject: msg.subject
            , message: '<b>'+msg.content+'</b><br/>'
            , altText: 'plain text'
        }, function (err, data, res) {
            if (err)
                return cb(err);
            cb(null, data);

        });

    },
    sendMail: function (email, token, cb) {
        // Give SES the details and let it construct the message for you.
        const url = config.env.domain + '/api/v1/auth/' + token;
        client.sendEmail({
            to: email
            , from: config.env.Verified_mail
            , cc: config.env.Verified_mail
            , bcc: [config.env.Verified_mail]
            , subject: 'testing'
            , message: '<b>Click here to reset password</b><br/> <a href="' + url + '">' + url + '</a>'
            , altText: 'plain text'
        }, function (err, data, res) {
            if (err)
                return cb(err);
            cb(null, data);

        });

    },
    sendMessage: function(number,cb){
        const otp = otplib.authenticator.generate(config.env.OTP_KEY);

        
        var params = {
            TableName: config.env.tableName.user,
            IndexName: 'phone_index',
            KeyConditionExpression: 'phone = :pub_id',
            ExpressionAttributeValues: { ':pub_id': number }
    
        }
    
        docClient.query(params,(err1,data1)=>{
    
            if (err1)
                    return cb(err1)
            if (data1.Count === 0)
                    return cb(null,"number doesn't exist");
        
        setTimeout(() => {
                var params = {
                    TableName: config.env.tableName.otp,
                    Item : {
                        user_id: data1.Items[0].user_id,
                        otp
                    }
                };
            
                docClient.put(params, function (err, data) {
                    if (err)
                        console.log(err);
            })
        }, 100);
    });
        
        var params = {
            Message: otp + ' is your One Time Password from EngagePulse',
            MessageStructure: 'string',
            PhoneNumber: '+91'+number,
            MessageAttributes : {
                'AWS.SNS.SMS.SenderID' :{
                    'DataType' : 'String',
                    'StringValue' : 'EnPulse',
                },
                'AWS.SNS.SMS.SMSType' : {
                    'DataType'    : 'String',
                    'StringValue' : 'Promotional',
                }
            }
            
          };
        sns.publish(params, function(err, data) {
        if (err) 
            cb(err) // an error occurre
        cb(null,data)     
    });

    },
    
    verifyOTP : function(otp,user_id,cb){
        
        var params = {"TableName":config.env.tableName.otp,"Key": {"user_id":user_id}}
        docClient.get(params, function(err,data){
            if (err)
                return cb(err);
            if (data == null || Object.keys(data).length === 0)
                return cb('No results found');
    
            if (data.Item.is_deleted === 0)
                return cb("Document doesn't exist");

            if(data.Item.otp !== otp)
                return cb("Wrong OTP");

            setTimeout(() => {
                var params={
                    TableName: config.env.tableName.otp,
                    Key:{
                        user_id:user_id
                    }
                }
                docClient.delete(params,(err,doc)=>{
                    if(err)
                        console.log(err);
                })

            }, 100);
            
            return cb(null,true);

            
        })

    }


};
module.exports = functions;