import SibApiV3Sdk from 'sib-api-v3-sdk';
import config from '../config/config';

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = config.mailerKey;

export const sendRegistrationMail = async (email, username, token) => {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = {
        to: [{
            email,
        }],
        templateId: 2,
        params: {
            name: username,
            link: `${config.backBaseUrl}/api/v1/auth/validate?token=${token}`,
        },
    };

    return apiInstance.sendTransacEmail(sendSmtpEmail)
    .then(function(data) {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
      }, function(error) {
        console.error(error);
      });
};

export const sendResetPassword = async (email, username, token) => {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = {
        to: [{
            email,
        }],
        templateId: 3,
        params: {
            name: username,
            link: `${config.frontBaseUrl}/reset-password?token=${token}`,
        },
    };

    return apiInstance.sendTransacEmail(sendSmtpEmail);
};
