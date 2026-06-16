const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const freelancers = [
  ["Mpho Maseko", "mpho.maseko@freelancerhubsa.co.za", "Mechanical Draughtsman", "Engineering"],
  ["Lerato Dlamini", "lerato.dlamini@freelancerhubsa.co.za", "Graphic Designer", "Graphic Design"],
  ["Sibusiso Nkosi", "sibusiso.nkosi@freelancerhubsa.co.za", "Web Developer", "Web Development"],
  ["Thando Khumalo", "thando.khumalo@freelancerhubsa.co.za", "Digital Marketer", "Marketing"],
  ["Naledi Molefe", "naledi.molefe@freelancerhubsa.co.za", "Admin Assistant", "Admin Support"],
  ["Kagiso Ncube", "kagiso.ncube@freelancerhubsa.co.za", "CAD Technician", "Engineering"],
  ["Zanele Sithole", "zanele.sithole@freelancerhubsa.co.za", "Content Writer", "Writing"],
  ["Tshepo Mahlangu", "tshepo.mahlangu@freelancerhubsa.co.za", "3D Designer", "3D Design"],
  ["Ayanda Mthembu", "ayanda.mthembu@freelancerhubsa.co.za", "Video Editor", "Video Editing"],
  ["Bonolo Motloung", "bonolo.motloung@freelancerhubsa.co.za", "Virtual Assistant", "Admin Support"],
];

async function seedFreelancers() {
  for (const [full_name, email, skills, category] of freelancers) {
    const { data: userData, error: userError } =
      await supabase.auth.admin.createUser({
        email,
        password: "FreelancerHubSA@123",
        email_confirm: true,
      });

    if (userError) {
      console.log("Auth error:", email, userError.message);
      continue;
    }

    const id = userData.user.id;

    const { error: profileError } = await supabase.from("profiles").insert({
      id,
      full_name,
      email,
      role: "freelancer",
      skills,
      category,
      verified: true,
      top_rated: Math.random() > 0.5,
      email_verified: true,
      bio: `${full_name} is a South African freelancer specialising in ${skills}. Available for professional projects through Freelancer Hub SA.`,
    });

    if (profileError) {
      console.log("Profile error:", email, profileError.message);
    } else {
      console.log("Created freelancer:", full_name);
    }
  }
}

seedFreelancers();