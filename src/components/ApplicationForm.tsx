import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle, MapPin } from 'lucide-react';

interface FormData {
  discordUsername: string;
  answers: string[];
}

const ApplicationForm = () => {
  const [formData, setFormData] = useState<FormData>({
    discordUsername: '',
    answers: Array(10).fill('')
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Hardcoded webhook URL
  const webhookUrl = 'https://discord.com/api/webhooks/1402312615061098617/STa6qI60XUrv_2uoYj1PkR17rEJJwrI4iga6EICxcH0RCXLs8rdEdHHFylvLKDiO4y5A';

  const questions = [
    "Why do you want to be staff?",
    "What are the key responsibilities within staff?",
    "What is RDM?",
    "What is FRP?",
    "What is Meta Gaming?",
    "Why should we choose you over others?",
    "What will you bring to the team?",
    "Will you meet the quota of 2 hours per week and 200 messages in main chat?",
    "Do you agree these are your own answers?",
    "Any questions for us?"
  ];

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...formData.answers];
    newAnswers[index] = value;
    setFormData({ ...formData, answers: newAnswers });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.discordUsername.trim()) {
      alert('Please provide your Discord username.');
      return;
    }

    if (formData.answers.some(answer => !answer.trim())) {
      alert('Please answer all questions.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Send to Discord webhook
      await sendToDiscord();
      setSubmitStatus('success');
      setFormData({
        discordUsername: '',
        answers: Array(10).fill('')
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendToDiscord = async () => {
    try {
      const embed = {
        title: "🏛️ Orlando City Roleplay - Staff Application",
        color: 0x3B82F6,
        thumbnail: {
          url: "https://images.pexels.com/photos/2245436/pexels-photo-2245436.jpeg?auto=compress&cs=tinysrgb&w=200"
        },
        fields: [
          {
            name: "📱 Discord Username",
            value: formData.discordUsername,
            inline: true
          },
          {
            name: "📅 Application Date",
            value: new Date().toLocaleDateString(),
            inline: true
          },
          {
            name: "\u200B",
            value: "\u200B",
            inline: false
          }
        ],
        footer: {
          text: "Orlando City Roleplay Staff Team",
          icon_url: "https://images.pexels.com/photos/2245436/pexels-photo-2245436.jpeg?auto=compress&cs=tinysrgb&w=50"
        },
        timestamp: new Date().toISOString()
      };

      questions.forEach((question, index) => {
        embed.fields.push({
          name: `❓ ${question}`,
          value: formData.answers[index] || "No answer provided",
          inline: false
        });
      });

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send application');
      }
    } catch (error) {
      console.error('Error sending to Discord:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center space-x-4">
            <MapPin className="w-12 h-12 text-blue-300" />
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2">Orlando City Roleplay</h1>
              <p className="text-blue-200 text-xl">Staff Application Portal</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Application Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Staff Application Form</h2>
              <p className="text-blue-200 text-lg">
                Join our dedicated staff team and help shape the Orlando City Roleplay experience
              </p>
            </div>

            <div className="space-y-8">
              {/* Discord Username */}
              <div>
                <label className="block text-white font-semibold mb-3 text-lg">
                  Discord Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.discordUsername}
                  onChange={(e) => setFormData({ ...formData, discordUsername: e.target.value })}
                  placeholder="your_username#1234"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Questions */}
              {questions.map((question, index) => (
                <div key={index} className="space-y-3">
                  <label className="block text-white font-semibold text-lg">
                    {index + 1}. {question} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.answers[index]}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="Please provide a detailed answer..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
                    required
                  />
                </div>
              ))}

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="flex items-center space-x-3 p-4 bg-green-500/20 border border-green-400/30 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="text-green-100">
                    Application submitted successfully! We'll review your application and get back to you soon.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="flex items-center space-x-3 p-4 bg-red-500/20 border border-red-400/30 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <p className="text-red-100">
                    Failed to submit application. Please try again or contact an administrator.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                    isSubmitting
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                  } text-white`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-white/20 text-center">
              <p className="text-blue-200">
                Thank you for your interest in joining the Orlando City Roleplay staff team!
              </p>
              <p className="text-blue-300 text-sm mt-2">
                All applications are carefully reviewed by our management team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;