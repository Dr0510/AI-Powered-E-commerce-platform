export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get("pincode");

  if (!pincode || !/^[0-9]{6}$/.test(pincode.replace(/\D/g, ""))) {
    return Response.json({ message: "Invalid pincode format" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await response.json();

    if (data.Status === "Error" || !data.PostOffice || data.PostOffice.length === 0) {
      return Response.json({ message: "Pincode not found", status: "error" }, { status: 404 });
    }

    const postOffice = data.PostOffice[0];
    return Response.json({
      status: "success",
      data: {
        city: postOffice.District || "",
        state: postOffice.State || "",
        address: `${postOffice.Block || ""}, ${postOffice.District || ""}, ${postOffice.State || ""}`.replace(/^, |, $|, ,/g, ""),
      },
    });
  } catch (error) {
    console.error("Pincode lookup error:", error);
    return Response.json({ message: "Unable to lookup pincode", status: "error" }, { status: 500 });
  }
}
