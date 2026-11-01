-- SINKRONISASI 2 BERITA TERBARU KE SUPABASE
INSERT INTO public.berita (news_id, slug, tanggal, judul, kategori, penulis, gambar_url, foto_url, ringkasan, isi, views, status, created_at)
VALUES (
  'NWS_1793524221042_69d7',
  'aaa-0bf3',
  '1 November 2026',
  'Aaa',
  'Kabar Alumni',
  'Bbb',
  'https://lh3.googleusercontent.com/d/1l4vC9tEVsKTEdsoTZ1cPCATG1FUEcYPa',
  'https://lh3.googleusercontent.com/d/1l4vC9tEVsKTEdsoTZ1cPCATG1FUEcYPa',
  'Ccc',
  'Ddddd<div><br></div><div><figure class="my-4 text-center select-none block clear-both"><img src="https://lh3.googleusercontent.com/d/15bHQ_ueLyM2lxeJ0yXpw163QTfRCy0PQ" alt="Foto Berita" class="max-w-full h-auto mx-auto rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 object-contain inline-block" style="max-height: 520px;"></figure><p><br></p></div>',
  0,
  'Publish',
  NOW()
) ON CONFLICT (news_id) DO UPDATE SET
  judul = EXCLUDED.judul,
  slug = EXCLUDED.slug,
  tanggal = EXCLUDED.tanggal,
  kategori = EXCLUDED.kategori,
  penulis = EXCLUDED.penulis,
  gambar_url = EXCLUDED.gambar_url,
  foto_url = EXCLUDED.foto_url,
  ringkasan = EXCLUDED.ringkasan,
  isi = EXCLUDED.isi,
  status = 'Publish';

INSERT INTO public.berita (news_id, slug, tanggal, judul, kategori, penulis, gambar_url, foto_url, ringkasan, isi, views, status, created_at)
VALUES (
  'NWS_1793491150504_m422',
  'pemkab-demak-gandeng-rmi-gelar-talkshow-pesantren-ramah-anak-perkuat-literasi-hukum-dan-perlindungan-santri-ezc2',
  '1 November 2026',
  'Pemkab Demak Gandeng RMI Gelar Talkshow Pesantren Ramah Anak, Perkuat Literasi Hukum dan Perlindungan Santri',
  'Kegiatan',
  'Talitha Mumtaza',
  'https://lh3.googleusercontent.com/d/1ghMeIX5vU9noeJoHXwjQlzI4CexMabwp',
  'https://lh3.googleusercontent.com/d/1ghMeIX5vU9noeJoHXwjQlzI4CexMabwp',
  'Abi Cholilullah sebagai Narasumber dalam kegiatan Talkshow bersama Kabag Kesra dan Kanit P2A Polres Demak',
  '<div><span style="font-size: 0.875rem;">DEMAK – Pemerintah Kabupaten Demak bekerja sama dengan Rabithah Ma’ahid Islamiyah (RMI) PCNU Demak menggelar Talkshow Pesantren bertema *“Transformasi Pesantren Ramah Anak: Penguatan Literasi Hukum dan Tata Kelola Perlindungan Santri”* di Hotel Amantis, Sabtu (31/10/2026).</span></div><div>Kegiatan ini menjadi bagian dari upaya memperkuat peran pesantren dalam menciptakan lingkungan pendidikan yang aman, nyaman, ramah anak, serta memiliki tata kelola perlindungan santri yang lebih baik. Selain itu, forum ini diharapkan mampu meningkatkan pemahaman para pengelola pesantren dan madrasah diniyyah terhadap aspek hukum, khususnya dalam pencegahan dan penanganan berbagai bentuk kekerasan di lingkungan pendidikan.</div><div>Dalam sambutannya, Kepala Bagian Kesejahteraan Rakyat (Kabag Kesra) Setda Kabupaten Demak, Ungguh Prakoso, S.Sos., menekankan pentingnya peran pesantren sebagai mitra strategis pemerintah dalam membangun sumber daya manusia yang berkarakter, religius, dan berakhlakul karimah.</div><div>Menurutnya, pesantren tidak hanya menjadi tempat untuk menimba ilmu agama, tetapi juga merupakan ruang pembentukan karakter sekaligus tempat mempersiapkan masa depan generasi bangsa. Karena itu, aspek keamanan, kenyamanan, dan perlindungan santri harus menjadi perhatian bersama.</div><div>“Pesantren memiliki kontribusi besar dalam membangun karakter generasi bangsa. Oleh karena itu, upaya menciptakan lingkungan pesantren yang aman dan memberikan perlindungan kepada seluruh santri merupakan tanggung jawab bersama. Pemerintah tentu berharap pesantren terus berkembang dengan tetap menjaga nilai-nilai luhur dan tradisi pendidikan yang telah diwariskan para ulama,” demikian pesan yang ditekankan dalam sambutan tersebut.</div><div>Sementara itu, Ketua RMI PCNU Demak, H. Ibrahim Cholilullah, dalam sambutannya menyampaikan bahwa pesantren harus senantiasa adaptif terhadap perkembangan zaman tanpa kehilangan jati diri, tradisi, dan nilai-nilai kepesantrenan.</div><div>Menurutnya, transformasi pesantren merupakan sebuah keniscayaan. Perubahan sosial, perkembangan teknologi, serta semakin kompleksnya persoalan masyarakat menuntut pesantren untuk terus melakukan pembenahan, baik dalam sistem pendidikan, pola pengasuhan, manajemen kelembagaan, maupun tata kelola perlindungan santri.</div><div>Ia menegaskan bahwa transformasi bukan berarti meninggalkan tradisi pesantren, melainkan memperkuat tradisi tersebut dengan pendekatan dan tata kelola yang lebih relevan dengan kebutuhan zaman.</div><div>“Pesantren harus mampu membaca perkembangan zaman. Transformasi menjadi salah satu alternatif agar pesantren semakin peka terhadap perubahan sosial dan berbagai tantangan yang dihadapi masyarakat. Kita ingin pesantren tetap kokoh dengan tradisi keilmuan dan nilai-nilai salaf, tetapi juga terbuka terhadap pembaruan yang membawa kemaslahatan,” ungkap Gus Cholil.</div><div>Lebih lanjut, Gus Cholil menyoroti pentingnya membangun kesadaran hukum di kalangan pengasuh, pengurus, tenaga pendidik, dan seluruh elemen pesantren. Menurutnya, persoalan hukum tidak boleh dianggap sebagai sesuatu yang jauh dari kehidupan pesantren. Justru, pemahaman terhadap hukum menjadi kebutuhan penting dalam menjaga keberlangsungan dan marwah lembaga pendidikan Islam.</div><div>Ia mengingatkan bahwa munculnya berbagai kasus kekerasan di lingkungan lembaga pendidikan, termasuk pondok pesantren dan madrasah diniyyah, harus menjadi bahan evaluasi dan perhatian serius bersama.</div><div>“Pesantren harus sadar hukum. Kita tidak boleh menutup mata terhadap berbagai kasus kekerasan yang terjadi di lingkungan lembaga pendidikan. Baik kekerasan fisik, psikis, seksual, perundungan, maupun bentuk kekerasan lainnya harus menjadi perhatian serius. Jangan sampai lembaga pendidikan yang seharusnya menjadi tempat menanamkan ilmu, akhlak, dan nilai-nilai kemanusiaan justru menjadi tempat yang tidak aman bagi anak-anak,” tegasnya.</div><div>Ia juga menekankan bahwa upaya perlindungan santri bukanlah bentuk pelemahan terhadap tradisi pesantren, melainkan bagian dari ikhtiar menjaga kehormatan pesantren dan melindungi masa depan generasi bangsa.</div><div>Dalam kegiatan tersebut, panitia menghadirkan tiga narasumber yang memiliki kompetensi dan pengalaman di bidang kepesantrenan, penegakan hukum, serta advokasi hukum.</div><div>Ketiga narasumber tersebut adalah H. Ibrahim Cholilullah selaku Ketua RMI Demak, Ipda Sulistiyono, S.H. selaku Kanit PPA Polres Demak, serta H. Ahmad Husen, S.H., M.H. dari LBH Ansor Pusat Koordinator Wilayah Jawa Tengah-DIY.</div><div>Melalui perspektif kelembagaan pesantren, penegakan hukum, dan pendampingan hukum, para narasumber diharapkan dapat memberikan pemahaman komprehensif mengenai pentingnya pencegahan kekerasan, mekanisme penanganan kasus, serta langkah-langkah perlindungan santri sesuai dengan ketentuan peraturan perundang-undangan.</div><div>Talkshow ini juga diharapkan menjadi ruang dialog dan berbagi pengalaman bagi para pengelola pondok pesantren dan madrasah diniyyah dalam menghadapi berbagai persoalan hukum yang semakin kompleks.</div><div>Melalui kolaborasi antara Pemerintah Kabupaten Demak dan RMI PCNU Demak, kegiatan ini diharapkan tidak berhenti sebagai forum diskusi semata, tetapi mampu melahirkan komitmen dan langkah nyata dalam membangun ekosistem pendidikan pesantren yang ramah anak, aman, bermartabat, dan berorientasi pada perlindungan santri.</div><div>Dengan demikian, pesantren diharapkan tetap menjadi benteng moral dan pusat pendidikan karakter bangsa, sekaligus menjadi lembaga pendidikan yang mampu menjawab tantangan zaman tanpa kehilangan ruh, tradisi, dan nilai-nilai luhur kepesantrenan.</div>',
  0,
  'Publish',
  NOW()
) ON CONFLICT (news_id) DO UPDATE SET
  judul = EXCLUDED.judul,
  slug = EXCLUDED.slug,
  tanggal = EXCLUDED.tanggal,
  kategori = EXCLUDED.kategori,
  penulis = EXCLUDED.penulis,
  gambar_url = EXCLUDED.gambar_url,
  foto_url = EXCLUDED.foto_url,
  ringkasan = EXCLUDED.ringkasan,
  isi = EXCLUDED.isi,
  status = 'Publish';

