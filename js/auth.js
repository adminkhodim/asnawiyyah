        // Ganti dengan URL Web App Apps Script Anda!
        const AUTH_API_URL = "https://script.google.com/macros/s/AKfycbz074VHNTe4YpDAAn7dD-uTkTGGJKxxd6vYX6DHU0oI7j0FBVzIMfyje4E5tYuY9sEKqg/exec"; 

        // State Check on Load
        document.addEventListener('DOMContentLoaded', () => {
            checkAuthState();
            initGoogleAuth();
        });

        function checkAuthState() {
            const token = localStorage.getItem('user_token');
            const userDataStr = localStorage.getItem('user_data');
            
            const loggedInView = document.getElementById('profile-logged-in');
            const loggedOutView = document.getElementById('profile-logged-out');
            
            if (!loggedInView || !loggedOutView) return;

            if (token && userDataStr) {
                // User is logged in
                const user = JSON.parse(userDataStr);
                document.getElementById('user-display-name').innerText = user.name || 'Santri / Alumni';
                document.getElementById('user-display-email').innerHTML = `<i class="fa-regular fa-envelope mr-1"></i> ${user.email}`;
                if (user.phone) {
                    document.getElementById('user-display-phone').innerHTML = `<i class="fa-brands fa-whatsapp mr-1 text-emerald-600"></i> ${user.phone}`;
                    document.getElementById('user-display-phone').classList.remove('hidden');
                } else {
                    document.getElementById('user-display-phone').classList.add('hidden');
                }
                
                // Update Avatar
                document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=15803d&color=fff&size=128`;
                
                loggedInView.classList.remove('hidden');
                loggedOutView.classList.add('hidden');
            } else {
                // Not logged in
                loggedInView.classList.add('hidden');
                loggedOutView.classList.remove('hidden');
            }
        }

        function handleLogout() {
            localStorage.removeItem('user_token');
            localStorage.removeItem('user_data');
            checkAuthState();
            alert("Anda telah keluar.");
        }

        async function handleEmailAuth(e) {
            e.preventDefault();
            
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            const btn = document.getElementById('btn-auth-email');
            const errorMsg = document.getElementById('login-error-msg');
            
            if (!email || !password) return;
            
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memproses...`;
            btn.disabled = true;
            errorMsg.classList.add('hidden');
            
            try {
                if (AUTH_API_URL.includes('Placeholder')) {
                    throw new Error("AUTH_API_URL belum dikonfigurasi. Silakan update script terlebih dahulu.");
                }

                const response = await fetch(AUTH_API_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'login', email: email, password: password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Login Success
                    localStorage.setItem('user_token', data.token);
                    localStorage.setItem('user_data', JSON.stringify(data.user));
                    checkAuthState();
                } else {
                    if (data.message.includes('belum terdaftar') || data.message.includes('not found')) {
                        // Request OTP Flow
                        const otpResp = await fetch(AUTH_API_URL, {
                            method: 'POST',
                            body: JSON.stringify({ action: 'request_otp', email: email })
                        });
                        const otpData = await otpResp.json();
                        
                        if (otpData.success) {
                            // Tampilkan Modal OTP
                            document.getElementById('otp-target-email').innerText = email;
                            
                            // Simpan sementara password untuk dikirim saat verifikasi OTP
                            sessionStorage.setItem('temp_reg_email', email);
                            sessionStorage.setItem('temp_reg_password', password);
                            
                            document.getElementById('otpModal').classList.remove('hidden');
                            setTimeout(() => {
                                document.getElementById('otpModalContent').classList.remove('scale-95', 'opacity-0');
                            }, 50);
                        } else {
                            throw new Error(otpData.message || "Gagal mengirim OTP");
                        }
                    } else {
                        throw new Error(data.message || "Login gagal");
                    }
                }
            } catch (error) {
                errorMsg.innerText = error.message;
                errorMsg.classList.remove('hidden');
            } finally {
                btn.innerHTML = `<span>Masuk / Daftar</span><i class="fa-solid fa-arrow-right"></i>`;
                btn.disabled = false;
            }
        }
        
        function closeOtpModal() {
            document.getElementById('otpModalContent').classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                document.getElementById('otpModal').classList.add('hidden');
            }, 300);
        }

        async function submitOtp(e) {
            e.preventDefault();
            
            const otp = document.getElementById('otp-input').value;
            const email = sessionStorage.getItem('temp_reg_email');
            const password = sessionStorage.getItem('temp_reg_password');
            const btn = document.getElementById('btn-submit-otp');
            const errorMsg = document.getElementById('otp-error-msg');
            
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memverifikasi...`;
            btn.disabled = true;
            errorMsg.classList.add('hidden');
            
            try {
                const response = await fetch(AUTH_API_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'verify_otp', email: email, otp: otp, password: password })
                });
                
                const data = await response.json();
                if (data.success) {
                    localStorage.setItem('user_token', data.token);
                    localStorage.setItem('user_data', JSON.stringify(data.user));
                    
                    sessionStorage.removeItem('temp_reg_email');
                    sessionStorage.removeItem('temp_reg_password');
                    
                    closeOtpModal();
                    checkAuthState();
                    alert("Akun berhasil diverifikasi & didaftarkan!");
                } else {
                    throw new Error(data.message || "Verifikasi OTP gagal");
                }
            } catch (error) {
                errorMsg.innerText = error.message;
                errorMsg.classList.remove('hidden');
            } finally {
                btn.innerHTML = `<span>Verifikasi Akun</span><i class="fa-solid fa-check-circle"></i>`;
                btn.disabled = false;
            }
        }

        // ==========================================
        // GOOGLE SIGN-IN INTEGRATION
        // ==========================================
        const GOOGLE_CLIENT_ID = "967127815898-6padn433letamnjfuacb5eg8pnv728p4.apps.googleusercontent.com"; 

        function initGoogleAuth() {
            if (typeof google === 'undefined' || !google.accounts) {
                setTimeout(initGoogleAuth, 500); // Tunggu sampai library siap
                return;
            }
            
            if (GOOGLE_CLIENT_ID.includes('GANTI_DENGAN')) return; // Abaikan jika belum di-setup

            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse
            });

            google.accounts.id.renderButton(
                document.getElementById("google-signin-container"),
                { theme: "outline", size: "large", width: "100%", text: "continue_with", shape: "pill" }
            );
        }

        async function handleCredentialResponse(response) {
            const token = response.credential;
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const gData = JSON.parse(jsonPayload);
            
            try {
                const apiResponse = await fetch(AUTH_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ 
                        action: 'google_login', 
                        credential: token,
                        email: gData.email, 
                        name: gData.name 
                    })
                });
                
                const data = await apiResponse.json();
                if (data.success) {
                    localStorage.setItem('user_token', data.token);
                    localStorage.setItem('user_data', JSON.stringify(data.user));
                    checkAuthState();
                } else {
                    alert("Gagal integrasi Google Login: " + data.message);
                }
            } catch (e) {
                alert("Koneksi gagal: " + e.message);
            }
        }