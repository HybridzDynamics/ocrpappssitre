import React from 'react';
import { Shield, Car, Flame, Truck, Fish, Users, Wrench, MapPin } from 'lucide-react';
import { DEPARTMENTS, type Department } from '../lib/types';

interface DepartmentSelectorProps {
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
}

const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  selectedDepartment,
  onDepartmentChange
}) => {
  const getDepartmentIcon = (departmentId: string) => {
    switch (departmentId) {
      case 'staff': return <Shield className="w-6 h-6" />;
      case 'Orlando City Sherrif Office': return <Shield className="w-6 h-6" />;
      case 'Orlando City Police Department': return <Shield className="w-6 h-6" />;
      case 'Orlando Fire and Rescue Department': return <Flame className="w-6 h-6" />;
      case 'Florida Highway Patrol': return <Car className="w-6 h-6" />;
      case 'Florida Fish and Wildlife Conservation Commission': return <Fish className="w-6 h-6" />;
      case 'Civilian Operations': return <Users className="w-6 h-6" />;
      case 'Florida Department of Transportation': return <Wrench className="w-6 h-6" />;
      default: return <MapPin className="w-6 h-6" />;
    }
  };

  return (
    <div className="w-full min-h-screen space-y-6 p-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Choose Your Department</h2>
        <p className="text-blue-200 text-lg">
          Select the department you'd like to apply for and help keep Orlando safe!
        </p>
      </div>

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        {DEPARTMENTS.map((department) => (
          <div
            key={department.id}
            className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 min-h-[300px] flex flex-col ${
              selectedDepartment === department.id
                ? 'border-blue-400 bg-blue-500/20 shadow-2xl shadow-blue-500/25'
                : department.isOpen
                ? 'border-white/20 bg-white/10 hover:border-blue-300 hover:bg-white/15'
                : 'border-red-400/50 bg-red-500/10 opacity-60 cursor-not-allowed'
            }`}
            onClick={() => department.isOpen && onDepartmentChange(department.id)}
          >
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20" />
            
            {/* Content */}
            <div className="relative p-6 backdrop-blur-sm flex-1 flex flex-col">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-3 rounded-full flex-shrink-0 ${
                  selectedDepartment === department.id
                    ? 'bg-blue-500 text-white'
                    : department.isOpen
                    ? 'bg-white/20 text-blue-300'
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {getDepartmentIcon(department.id)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold text-white truncate">{department.name}</h3>
                  {!department.isOpen && (
                    <span className="text-red-300 text-sm font-medium">Currently Closed</span>
                  )}
                </div>
              </div>

              <h4 className="text-lg font-semibold text-blue-200 mb-2 leading-tight">
                {department.fullName}
              </h4>

              <p className="text-slate-300 text-sm mb-4 flex-1 leading-relaxed">
                {department.description}
              </p>

              <div className="space-y-3 mt-auto">
                                
                <div className="text-center px-2 py-2 bg-white/5 rounded-lg">
                  <span className="text-blue-200 text-sm italic">"{department.motto}"</span>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full font-medium">
                      Age {department.requirements.minAge}+
                    </span>
                    {department.requirements.micRequired && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full font-medium">
                        Mic Required
                      </span>
                    )}
                    {department.requirements.experiencePreferred && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full font-medium">
                        Experience Preferred
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedDepartment === department.id && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedDepartment && (
        <div className="w-full max-w-4xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 mt-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">
              Ready to apply for {DEPARTMENTS.find(d => d.id === selectedDepartment)?.fullName}?
            </h3>
            <p className="text-slate-300">
              Please fill out the application form below with detailed and honest answers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentSelector;