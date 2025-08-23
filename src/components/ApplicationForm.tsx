import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle, MapPin, ArrowLeft, Upload, X, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DepartmentSelector from './DepartmentSelector';
import { DEPARTMENTS } from '../lib/types';

interface FormData {
  discordUsername: string;
  department: string;
  answers: string[];
  applicantEmail: string;
  applicantAge: string;
  previousExperience: string;
  timezone: string;
  availability: string;
}

interface FileUpload {
  file: File;
  preview: string;
  id: string;
}

interface DepartmentWebhooks {
  [key: string]: string;
}

const ApplicationForm = () => {
  const [formData, setFormData] = useState<FormData>({
    discordUsername: '',
    department: '',
    answers: Array(10).fill(''),
    applicantEmail: '',
    applicantAge: '',
    previousExperience: '',
    timezone: '',
    availability: ''
  });
  
  // Department-specific webhook URLs
  const [departmentWebhooks, setDepartmentWebhooks] = useState<DepartmentWebhooks>({
    staff: 'https://discord.com/api/webhooks/1408827535973945504/D8wrpODjinSfqFOGaTr5dseUJsM7-0QiLjYRLFChTMpR8ikL53k7fiVppBR1SRukHNIA',
    ocpd: 'https://discord.com/api/webhooks/1408829374437920828/kaU5LGJFUgfwKqAfxYJ5bTk7z7jffK3H_xjJWC_m6y5ClPLis6C0dZOlhT4GS0Lxyyby',
    ocso: 'https://discord.com/api/webhooks/1408829292867096677/IF775mlI1uPstTD2ZnUDqHZjGMxFVqp7dV_CozC_tNW3ngYX8ocD1jvHdkhVRVKqBMjt',
    fhp: 'https://discord.com/api/webhooks/1408829488036446351/0qpfqGnsryEBmKwyVMQudAxX0eck9rdBugO8F1tCrIuTHlslyX8h3R1nEQpOY5gdetRh',
    fwc: 'https://discord.com/api/webhooks/1408829212655222824/W5fQ6SrTegdkOssdA6kG2RTLLGKcXiROG7vJqNDJIKOPGcwIBTmFcfJyXJ6EJ544DyHX',
    civilian: 'https://discord.com/api/webhooks/1408832732045246626/NLDOCaUVruGTI0cunrTKYhf1mBkUTM1tr8RMDteJawuFxuJyA0NzbGxTxzybUFuU_Dmd',
    fdot: 'https://discord.com/api/webhooks/1408827535973945504/D8wrpODjinSfqFOGaTr5dseUJsM7-0QiLjYRLFChTMpR8ikL53k7fiVppBR1SRukHNIA',
    ocfrd: 'https://discord.com/api/webhooks/1408829582337118218/5DF6ONaHNhSzw2jM9ZpA2yySa_Hex3bE9ENyTFHG_pGn8FrNwabP0jNTF_3Ahdi4t0CH'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState<'department' | 'form'>('department');
  const [questions, setQuestions] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDepartmentChange = async (departmentId: string) => {
    setFormData({ ...formData, department: departmentId });
    
    // Fetch questions for the selected department
    try {
      const { data, error } = await supabase
        .from('application_templates')
        .select('questions')
        .eq('department', departmentId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      
      const departmentQuestions = data?.questions || [];
      setQuestions(departmentQuestions);
      setFormData(prev => ({ 
        ...prev, 
        answers: Array(departmentQuestions.length).fill('') 
      }));
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Fallback to default questions
      const defaultQuestions = [
        "Why do you want to join this department?",
        "What relevant experience do you have?",
        "How would you handle difficult situations?",
        "What does teamwork mean to you?",
        "How do you handle stress and pressure?",
        "What are your strengths and weaknesses?",
        "How would you contribute to our community?",
        "What are your availability hours?",
        "Do you have any questions for us?",
        "Is there anything else we should know about you?"
      ];
      setQuestions(defaultQuestions);
      setFormData(prev => ({ 
        ...prev, 
        answers: Array(defaultQuestions.length).fill('') 
      }));
    }
  };

  const handleContinueToForm = () => {
    if (formData.department) {
      setCurrentStep('form');
    }
  };

  const handleBackToDepartments = () => {
    setCurrentStep('department');
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...formData.answers];
    newAnswers[index] = value;
    setFormData({ ...formData, answers: newAnswers });
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: FileUpload = {
          file,
          preview: e.target?.result as string,
          id: Math.random().toString(36).substr(2, 9)
        };
        setUploadedFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.discordUsername.trim()) {
      alert('Please provide your Discord username.');
      return;
    }

    if (!formData.department) {
      alert('Please select a department.');
      return;
    }

    if (formData.answers.some(answer => !answer.trim())) {
      alert('Please answer all questions.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Send to department-specific Discord webhook first
      const departmentWebhookUrl = departmentWebhooks[formData.department];
      if (departmentWebhookUrl) {
        console.log('Sending to Discord webhook:', departmentWebhookUrl);
        await sendToDiscord(departmentWebhookUrl);
      } else {
        console.warn('No webhook configured for department:', formData.department);
      }

      // Try to save to database (if Supabase is available)
      try {
        const { data: dbData, error: dbError } = await supabase
          .from('applications')
          .insert([
            {
              discord_username: formData.discordUsername,
              department: formData.department,
              answers: formData.answers,
              applicant_email: formData.applicantEmail || null,
              applicant_age: formData.applicantAge ? parseInt(formData.applicantAge) : null,
              previous_experience: formData.previousExperience || null,
              timezone: formData.timezone || null,
              availability: formData.availability || null,
              status: 'pending',
              priority: 'normal'
            }
          ])
          .select()
          .single();

        if (dbError) {
          console.warn('Database save failed, but Discord webhook sent successfully:', dbError);
        } else {
          console.log('Successfully saved to database:', dbData);

          // Upload files if any and database save was successful
          if (uploadedFiles.length > 0) {
            for (const fileUpload of uploadedFiles) {
              try {
                await supabase
                  .from('application_attachments')
                  .insert([
                    {
                      application_id: dbData.id,
                      filename: fileUpload.file.name,
                      file_url: fileUpload.preview,
                      file_size: fileUpload.file.size,
                      mime_type: fileUpload.file.type
                    }
                  ]);
              } catch (fileError) {
                console.warn('Failed to save file attachment:', fileError);
              }
            }
          }
        }
      } catch (dbError) {
        console.warn('Database operation failed, but Discord webhook was sent:', dbError);
      }

      setSubmitStatus('success');
      setFormData({
        discordUsername: '',
        department: '',
        answers: Array(questions.length).fill(''),
        applicantEmail: '',
        applicantAge: '',
        previousExperience: '',
        timezone: '',
        availability: ''
      });
      setCurrentStep('department');
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendToDiscord = async (webhookUrl: string) => {
    try {
      console.log('Attempting to send to Discord webhook...');
      const selectedDept = DEPARTMENTS.find(d => d.id === formData.department);
      
      const embed = {
        title: `🏛️ New Application - ${selectedDept?.fullName || 'Orlando City Roleplay'}`,
        color: 0x3B82F6,
        description: `A new application has been submitted for ${selectedDept?.fullName}`,
        fields: [
          {
            name: "📱 Discord Username",
            value: formData.discordUsername,
            inline: true
          },
          {
            name: "🏢 Department",
            value: selectedDept?.fullName || formData.department,
            inline: true
          },
          {
            name: "📅 Application Date",
            value: new Date().toLocaleDateString(),
            inline: true
          },
          ...(formData.applicantEmail ? [{
            name: "📧 Email",
            value: formData.applicantEmail,
            inline: true
          }] : []),
          ...(formData.applicantAge ? [{
            name: "🎂 Age",
            value: formData.applicantAge,
            inline: true
          }] : []),
          ...(formData.timezone ? [{
            name: "🌍 Timezone",
            value: formData.timezone,
            inline: true
          }] : []),
          {
            name: "\u200B",
            value: "\u200B",
            inline: false
          }
        ],
        footer: {
          text: `Orlando City Roleplay - ${selectedDept?.name || 'Application'}`,
        },
        timestamp: new Date().toISOString()
      };

      // Add additional info if provided
      if (formData.previousExperience) {
        embed.fields.push({
          name: "💼 Previous Experience",
          value: formData.previousExperience.slice(0, 1000),
          inline: false
        });
      }

      if (formData.availability) {
        embed.fields.push({
          name: "⏰ Availability",
          value: formData.availability,
          inline: false
        });
      }

      // Add questions and answers
      questions.forEach((question, index) => {
        embed.fields.push({
          name: `❓ ${question}`,
          value: formData.answers[index]?.slice(0, 1000) || "No answer provided",
          inline: false
        });
      });

      const payload = {
        embeds: [embed],
        username: "Orlando City Roleplay",
        avatar_url: "https://images-ext-1.discordapp.net/external/IvxSrSKnMBPNgj2sGOucgddqvz_j9GnNGcieNAA8600/%3Fsize%3D512/https/cdn.discordapp.com/icons/1200823287186473101/ecda24c6fc7ef39a998bfd25f14e7c89.png" // Optional: replace with your server's icon
      };

      console.log('Sending payload to Discord:', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Discord webhook response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Discord webhook error:', errorText);
        throw new Error(`Discord webhook failed: ${response.status} - ${errorText}`);
      }

      console.log('Successfully sent to Discord webhook!');
    } catch (error) {
      console.error('Error sending to Discord:', error);
      // Re-throw the error so the parent function can handle it
      throw error;
    }
  };

  if (currentStep === 'department') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex items-center justify-center space-x-4">
              <MapPin className="w-12 h-12 text-blue-300" />
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-2">Orlando City Roleplay</h1>
                <p className="text-blue-200 text-xl">Department Application Portal</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl p-8">
            <DepartmentSelector
              selectedDepartment={formData.department}
              onDepartmentChange={handleDepartmentChange}
            />
            
            {formData.department && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleContinueToForm}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Continue to Application
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center space-x-4">
            <MapPin className="w-12 h-12 text-blue-300" />
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2">Orlando City Roleplay</h1>
              <p className="text-blue-200 text-xl">
                {DEPARTMENTS.find(d => d.id === formData.department)?.fullName} Application
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={handleBackToDepartments}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Departments</span>
          </button>
        </div>

        {/* Application Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                {DEPARTMENTS.find(d => d.id === formData.department)?.fullName} Application
              </h2>
              <p className="text-blue-200 text-lg">
                {DEPARTMENTS.find(d => d.id === formData.department)?.description}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Section */}
              <div className="bg-white/5 rounded-xl p-6 space-y-6">
                <h3 className="text-2xl font-semibold text-white mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  {/* Email */}
                  <div>
                    <label className="block text-white font-semibold mb-3 text-lg">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.applicantEmail}
                      onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-white font-semibold mb-3 text-lg">
                      Age
                    </label>
                    <input
                      type="number"
                      min="13"
                      max="100"
                      value={formData.applicantAge}
                      onChange={(e) => setFormData({ ...formData, applicantAge: e.target.value })}
                      placeholder="18"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-white font-semibold mb-3 text-lg">
                      Timezone
                    </label>
                    <input
                      type="text"
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      placeholder="EST, PST, GMT, etc."
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-white font-semibold mb-3 text-lg">
                    Availability
                  </label>
                  <textarea
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    placeholder="When are you typically available? (e.g., Weekdays 6-10 PM EST, Weekends all day)"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Previous Experience */}
                <div>
                  <label className="block text-white font-semibold mb-3 text-lg">
                    Previous Experience
                  </label>
                  <textarea
                    value={formData.previousExperience}
                    onChange={(e) => setFormData({ ...formData, previousExperience: e.target.value })}
                    placeholder="Tell us about your relevant experience in roleplay, moderation, or similar roles..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>

              {/* Application Questions */}
              <div className="bg-white/5 rounded-xl p-6 space-y-6">
                <h3 className="text-2xl font-semibold text-white mb-4">Application Questions</h3>
                
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
              </div>

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
                    Failed to submit application. Please try again.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
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
            </form>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-white/20 text-center">
              <p className="text-blue-200">
                Thank you for your interest in joining {DEPARTMENTS.find(d => d.id === formData.department)?.fullName}!
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