import React, { useState } from "react";

const ContactContent = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // כאן אפשר להוסיף שליחה לשרת / EmailJS / Formspree
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
      {/* Contact Info */}
      <div className="text-right text-gray-700 space-y-2">
        <p>📬 נשמח לשמוע ממך!</p>
        <ul className="list-disc pr-5 space-y-1">
          <li>✉️ <strong>דוא"ל:</strong> support@spotly.app</li>
          <li>📞 <strong>טלפון:</strong> 052-2385340</li>
          <li>🕒 <strong>שעות פעילות:</strong> א׳–ה׳, 9:00–17:00</li>
        </ul>
        <p>🤗 צוות <strong>Spotly</strong> כאן בשבילך!</p>
      </div>

      {/* Contact Form or Thank You Message */}
      {/* <div className="border border-black rounded-lg p-6">
        {submitted ? (
          <p className="text-center text-xl font-semibold text-green-700">
            ✅ תודה, נחזור אלייך בהקדם!
          </p>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-6 text-right">📥 צור קשר</h2>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    className="w-full border-b border-black outline-none py-1"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Last Name *</label>
                  <input
                    type="text"
                    className="w-full border-b border-black outline-none py-1"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    className="w-full border-b border-black outline-none py-1"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    className="w-full border-b border-black outline-none py-1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Message</label>
                <textarea
                  rows="4"
                  className="w-full border border-black p-2 resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition"
              >
                Send
              </button>
            </form>
          </>
        )} */}
      {/* </div> */}
    </div>
  );
};

export default ContactContent;
