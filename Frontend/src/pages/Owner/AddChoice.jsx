import { Bike, Car, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AddChoice() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 px-4">
      <button     onClick={() => navigate("/owner")}
      className="flex items-center gap-2 text-sm text-gray-600">
        <ArrowLeft size={16} /> Back to home
      </button>

      <div className="bg-white rounded-2xl p-6 space-y-6">
        <div className="rounded-xl p-5 bg-gray-50">
          <h2 className="text-lg font-semibold flex gap-2 items-center">
            <Car size={18} /> Add Vehicle
          </h2>
          <p className="text-sm text-gray-500">
            Choose what you want to add
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* ADD BIKE */}
          <button
            onClick={() => navigate("/owner/add-bike")}
            className="border rounded-xl p-6 flex gap-4 hover:bg-gray-50"
          >
            <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center">
              <Bike />
            </div>
            <div>
              <h3 className="font-semibold">Add Bike</h3>
              <p className="text-sm text-gray-500">Add a new bike</p>
            </div>
          </button>

          {/* ADD VEHICLE */}
          <button
            onClick={() => navigate("/owner/add-vehicle")}
            className="border rounded-xl p-6 flex gap-4 hover:bg-gray-50"
          >
            <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center">
              <Car />
            </div>
            <div>
              <h3 className="font-semibold">Add Vehicle</h3>
              <p className="text-sm text-gray-500">Add cars or SUVs</p>
            </div>
          </button>
        </div>
      </div>

{/* ================= VEHICLE LISTING TERMS ================= */}
<div className="mt-8 rounded-2xl bg-white dark:bg-[#020617] border border-gray-200 dark:border-white/10">

  <details className="group p-6">
    <summary className="flex cursor-pointer items-center justify-between list-none">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Vehicle Listing Terms
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Simple rules to follow before listing a vehicle
        </p>
      </div>
      <span className="text-gray-400 transition-transform group-open:rotate-180">
        ⌄
      </span>
    </summary>

    <div className="mt-6 space-y-4 text-sm text-gray-600 dark:text-gray-400">

      <div className="rounded-lg border border-gray-200 dark:border-white/10 p-4">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Correct Vehicle Details
        </h4>
        <p className="mt-1">
          Enter the correct vehicle name, model, year, and registration number.
          Details should match the actual vehicle.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-white/10 p-4">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Valid Documents Required
        </h4>
        <p className="mt-1">
          The vehicle must have a valid registration certificate, active
          insurance, and pollution certificate.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-white/10 p-4">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Safe & Working Condition
        </h4>
        <p className="mt-1">
          The vehicle should be in good condition, safe to drive, and ready
          for regular use.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-white/10 p-4">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Real Vehicle Photos
        </h4>
        <p className="mt-1">
          Upload clear and real photos of the vehicle. Do not use stock or
          edited images.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-white/10 p-4">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Clear Pricing & Availability
        </h4>
        <p className="mt-1">
          Set the correct rental price, location, and availability to avoid
          booking issues.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-white/10 p-4">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Listing Review
        </h4>
        <p className="mt-1">
          Vehicle listings may be reviewed or removed if details or documents
          are incorrect.
        </p>
      </div>

    </div>

    <div className="mt-6 border-t border-gray-200 dark:border-white/10 pt-4 text-xs text-gray-500 dark:text-gray-400">
      By listing a vehicle, you agree to follow these rules.
    </div>
  </details>
</div>

    </div>
  );
}
