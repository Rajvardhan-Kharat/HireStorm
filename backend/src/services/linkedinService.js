const axios = require('axios');
const Internship = require('../models/Internship');

/**
 * Share a certificate to LinkedIn using the UGC Posts API v2.
 * Requires the intern's stored LinkedIn access token.
 */
const shareCertificateOnLinkedIn = async (internshipId) => {
  const internship = await Internship.findById(internshipId)
    .populate('intern', 'profile.linkedinId profile.linkedinAccessToken profile.firstName profile.lastName');

  if (!internship.certificate?.isGenerated) throw new Error('Certificate not generated');
  const { linkedinId, linkedinAccessToken, firstName, lastName } = internship.intern.profile;
  if (!linkedinAccessToken) throw new Error('LinkedIn not connected');

  const certUrl = internship.certificate.certificateUrl;
  const certId = internship.certificate.certificateId;
  const verifyUrl = `${process.env.CLIENT_URL}/verify/${certId}`;

  const postBody = {
    author: `urn:li:person:${linkedinId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: `🏆 I have successfully completed the 90-Day Internship Program at HireStorm!\n\nThis internship covered real-world projects, daily tracking, mentor reviews, and a final certification exam.\n\nCertificate ID: ${certId}\nVerify: ${verifyUrl}\n\n#internship #hirestorm #certificate #career`,
        },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            description: { text: 'HireStorm 90-Day Internship Certificate' },
            originalUrl: certUrl,
            title: { text: `Certificate of Completion — ${firstName} ${lastName}` },
          },
        ],
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  };

  const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', postBody, {
    headers: {
      Authorization: `Bearer ${linkedinAccessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
  });

  internship.certificate.linkedinShared = true;
  internship.certificate.linkedinPostUrl = response.headers['x-restli-id'] || '';
  await internship.save();

  return { success: true, postId: response.headers['x-restli-id'] };
};

module.exports = { shareCertificateOnLinkedIn };
